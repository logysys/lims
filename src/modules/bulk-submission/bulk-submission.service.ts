import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

import { SampleBatch } from '@modules/samples/entities/sample-batch.entity';
import { Sample } from '@modules/samples/entities/sample.entity';
import { Product } from '@modules/products/entities/product.entity';
import { TestMethod } from '@modules/testing/entities/test-method.entity';
import { SampleTest } from '@modules/testing/entities/sample-test.entity';
import { AuditService } from '@modules/audit/audit.service';
import { SampleStatus, PriorityLevel, AuditAction } from '@common/enums';

// ============================================================
// TYPES / INTERFACES (exported so the controller can use them)
// ============================================================

export type ValidationErrorType =
  | 'missing'
  | 'invalid_format'
  | 'out_of_range'
  | 'not_found'
  | 'duplicate';

export interface ValidationError {
  row: number;
  field: string;
  errorType: ValidationErrorType;
  message: string;
  suggestion?: string;
  value?: any;
}

export interface ValidationReport {
  totalRows: number;
  validRows: number;
  errorRows: number;
  dataQualityScore: number;
  errors: ValidationError[];
  preview: Record<string, any>[];
}

export interface ParsedFile {
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
}

export interface ColumnMapping {
  productCode: string;
  lotNumber: string;
  manufacturingDate?: string;
  expirationDate?: string;
  sampleWeight?: string;
  sampleVolume?: string;
  unit?: string;
  testParameters?: string;
  sampleType?: string;
  storageCondition?: string;
}

export interface ValidatedRow {
  rowNumber: number;
  raw: Record<string, any>;
  product: Product;
  lotNumber: string;
  manufacturingDate?: Date;
  expirationDate?: Date;
  sampleWeight?: number;
  sampleVolume?: number;
  unit?: string;
  testMethodIds: string[];
  sampleType?: string;
  storageCondition?: string;
}

export interface BatchCreationResult {
  batchId: string;
  batchNumber: string;
  sampleCount: number;
  samples: { id: string; sampleCode: string }[];
}

export interface SubmitBatchOptions {
  customerId: string;
  userId: string;
  purchaseOrder?: string;
  dueDate?: Date;
  priority?: PriorityLevel;
  notes?: string;
  batchNumber?: string;
}

// ============================================================
// SERVICE
// ============================================================

@Injectable()
export class BulkSubmissionService {
  private readonly logger = new Logger(BulkSubmissionService.name);

  // File size / row limits
  private readonly MAX_ROWS = 5000;
  private readonly MIN_QUALITY_SCORE = 95;

  constructor(
    @InjectRepository(SampleBatch)
    private readonly batchRepository: Repository<SampleBatch>,

    @InjectRepository(Sample)
    private readonly sampleRepository: Repository<Sample>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(TestMethod)
    private readonly testMethodRepository: Repository<TestMethod>,

    @InjectRepository(SampleTest)
    private readonly sampleTestRepository: Repository<SampleTest>,

    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  // ============================================================
  // 1. PARSING
  // ============================================================

  /**
   * Parse a CSV or XLSX buffer into structured rows.
   * Auto-detects the format from the filename / mime type.
   */
  async parseFile(
    buffer: Buffer,
    filename?: string,
    mimetype?: string,
  ): Promise<ParsedFile> {
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('Uploaded file is empty');
    }

    const lowerName = (filename || '').toLowerCase();
    const isExcel =
      lowerName.endsWith('.xlsx') ||
      lowerName.endsWith('.xls') ||
      mimetype ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimetype === 'application/vnd.ms-excel';

    let rows: Record<string, any>[];

    try {
      if (isExcel) {
        rows = this.parseExcel(buffer);
      } else {
        rows = this.parseCSV(buffer);
      }
    } catch (err: any) {
      this.logger.error(`Failed to parse file: ${err.message}`);
      throw new BadRequestException(`Failed to parse file: ${err.message}`);
    }

    // Remove fully empty rows
    rows = rows.filter((row) =>
      Object.values(row).some(
        (v) => v !== null && v !== undefined && String(v).trim() !== '',
      ),
    );

    if (rows.length === 0) {
      throw new BadRequestException('No data rows found in the uploaded file');
    }

    if (rows.length > this.MAX_ROWS) {
      throw new BadRequestException(
        `Too many rows (${rows.length}). Maximum allowed is ${this.MAX_ROWS}.`,
      );
    }

    const headers = Object.keys(rows[0]);

    return {
      headers,
      rows,
      totalRows: rows.length,
    };
  }

  /**
   * Parse CSV buffer using csv-parse.
   */
  private parseCSV(buffer: Buffer): Record<string, any>[] {
    return parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      bom: true,
    });
  }

  /**
   * Parse XLSX/XLS buffer using the SheetJS library.
   */
  private parseExcel(buffer: Buffer): Record<string, any>[] {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error('Excel file contains no sheets');
    }
    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
      defval: '',
      raw: false,
    });
    return rows;
  }

  // ============================================================
  // 2. VALIDATION
  // ============================================================

  /**
   * Validate parsed rows against the column mapping and business rules.
   * Returns a full report with errors and suggestions.
   */
  async validateRows(
    rows: Record<string, any>[],
    columnMapping: ColumnMapping | Record<string, string>,
    options?: {
      dateFormat?: string;
      customerId?: string;
    },
  ): Promise<ValidationReport> {
    const mapping = this.normalizeMapping(columnMapping);
    const errors: ValidationError[] = [];
    const validRows: ValidatedRow[] = [];

    if (!mapping.productCode) {
      throw new BadRequestException(
        'Column mapping must include "productCode" field',
      );
    }
    if (!mapping.lotNumber) {
      throw new BadRequestException(
        'Column mapping must include "lotNumber" field',
      );
    }

    // ---------- Pre-load referenced products ----------
    const productCodes = this.unique(
      rows
        .map((r) => r[mapping.productCode!])
        .filter((v) => v !== undefined && v !== null && String(v).trim() !== ''),
    );

    const products = productCodes.length
      ? await this.productRepository.find({
          where: productCodes.map((code) => ({ productCode: code })),
        })
      : [];

    const productMap = new Map<string, Product>(
      products.map((p) => [p.productCode, p]),
    );

    // ---------- Pre-load all test methods for parameter resolution ----------
    const allMethods = await this.testMethodRepository.find({
      where: { isCurrent: true },
    });
    const methodLookup = new Map<string, TestMethod>();
    for (const m of allMethods) {
      methodLookup.set(m.methodName.toLowerCase(), m);
      methodLookup.set(m.methodCode.toLowerCase(), m);
    }

    // ---------- Track duplicates within the file ----------
    const seenLotKeys = new Set<string>();

    // ---------- Validate each row ----------
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +1 for 0-index, +1 for header row
      const rowErrors: ValidationError[] = [];

      // -- productCode --
      const productCode = this.trimStr(row[mapping.productCode!]);
      let product: Product | undefined;

      if (!productCode) {
        rowErrors.push({
          row: rowNumber,
          field: 'productCode',
          errorType: 'missing',
          message: 'Product code is required',
        });
      } else {
        product = productMap.get(productCode);
        if (!product) {
          rowErrors.push({
            row: rowNumber,
            field: 'productCode',
            errorType: 'not_found',
            message: `Product code "${productCode}" not found`,
            suggestion:
              'Register the product first or verify the product code spelling',
            value: productCode,
          });
        } else if (!product.isActive) {
          rowErrors.push({
            row: rowNumber,
            field: 'productCode',
            errorType: 'invalid_format',
            message: `Product "${productCode}" is inactive`,
            suggestion: 'Reactivate the product or use a different one',
            value: productCode,
          });
        }
      }

      // -- lotNumber --
      const lotNumber = this.trimStr(row[mapping.lotNumber!]);
      if (!lotNumber) {
        rowErrors.push({
          row: rowNumber,
          field: 'lotNumber',
          errorType: 'missing',
          message: 'Lot number is required',
        });
      } else {
        const lotKey = `${productCode}::${lotNumber}`.toLowerCase();
        if (seenLotKeys.has(lotKey)) {
          rowErrors.push({
            row: rowNumber,
            field: 'lotNumber',
            errorType: 'duplicate',
            message: `Duplicate lot "${lotNumber}" for product "${productCode}" in this file`,
            suggestion: 'Remove the duplicate row or use a unique lot number',
            value: lotNumber,
          });
        } else {
          seenLotKeys.add(lotKey);
        }

        // Check DB for existing lot
        if (product) {
          const existingSample = await this.sampleRepository.findOne({
            where: { lotNumber, productId: product.id },
          });
          if (existingSample) {
            rowErrors.push({
              row: rowNumber,
              field: 'lotNumber',
              errorType: 'duplicate',
              message: `Lot "${lotNumber}" already exists for this product`,
              suggestion: 'Use a different lot number or skip this row',
              value: lotNumber,
            });
          }
        }
      }

      // -- manufacturingDate --
      let manufacturingDate: Date | undefined;
      if (mapping.manufacturingDate) {
        const raw = this.trimStr(row[mapping.manufacturingDate]);
        if (raw) {
          const parsed = this.parseDate(raw, options?.dateFormat);
          if (!parsed) {
            rowErrors.push({
              row: rowNumber,
              field: 'manufacturingDate',
              errorType: 'invalid_format',
              message: `Invalid date format: "${raw}"`,
              suggestion: 'Use format YYYY-MM-DD (e.g., 2024-01-15)',
              value: raw,
            });
          } else if (parsed > new Date()) {
            rowErrors.push({
              row: rowNumber,
              field: 'manufacturingDate',
              errorType: 'out_of_range',
              message: 'Manufacturing date cannot be in the future',
              suggestion: 'Verify the date',
              value: raw,
            });
          } else {
            manufacturingDate = parsed;
          }
        }
      }

      // -- expirationDate --
      let expirationDate: Date | undefined;
      if (mapping.expirationDate) {
        const raw = this.trimStr(row[mapping.expirationDate]);
        if (raw) {
          const parsed = this.parseDate(raw, options?.dateFormat);
          if (!parsed) {
            rowErrors.push({
              row: rowNumber,
              field: 'expirationDate',
              errorType: 'invalid_format',
              message: `Invalid date format: "${raw}"`,
              suggestion: 'Use format YYYY-MM-DD (e.g., 2025-01-15)',
              value: raw,
            });
          } else if (
            manufacturingDate &&
            parsed.getTime() < manufacturingDate.getTime()
          ) {
            rowErrors.push({
              row: rowNumber,
              field: 'expirationDate',
              errorType: 'out_of_range',
              message: 'Expiration date must be after manufacturing date',
              suggestion: 'Verify both dates',
              value: raw,
            });
          } else {
            expirationDate = parsed;
          }
        }
      }

      // -- sampleWeight --
      let sampleWeight: number | undefined;
      if (mapping.sampleWeight) {
        const raw = this.trimStr(row[mapping.sampleWeight]);
        if (raw) {
          const num = Number(raw);
          if (Number.isNaN(num) || num < 0) {
            rowErrors.push({
              row: rowNumber,
              field: 'sampleWeight',
              errorType: 'invalid_format',
              message: `Invalid weight: "${raw}"`,
              suggestion: 'Enter a positive number',
              value: raw,
            });
          } else {
            sampleWeight = num;
          }
        }
      }

      // -- sampleVolume --
      let sampleVolume: number | undefined;
      if (mapping.sampleVolume) {
        const raw = this.trimStr(row[mapping.sampleVolume]);
        if (raw) {
          const num = Number(raw);
          if (Number.isNaN(num) || num < 0) {
            rowErrors.push({
              row: rowNumber,
              field: 'sampleVolume',
              errorType: 'invalid_format',
              message: `Invalid volume: "${raw}"`,
              suggestion: 'Enter a positive number',
              value: raw,
            });
          } else {
            sampleVolume = num;
          }
        }
      }

      // -- unit --
      const unit = mapping.unit
        ? this.trimStr(row[mapping.unit]) || undefined
        : undefined;

      // -- sampleType --
      const sampleType = mapping.sampleType
        ? this.trimStr(row[mapping.sampleType]) || undefined
        : undefined;

      // -- storageCondition --
      const storageCondition = mapping.storageCondition
        ? this.trimStr(row[mapping.storageCondition]) || undefined
        : undefined;

      // -- testParameters (comma-separated method names or codes) --
      const testMethodIds: string[] = [];
      if (mapping.testParameters) {
        const raw = this.trimStr(row[mapping.testParameters]);
        if (raw) {
          const parts = raw
            .split(/[,;|]/)
            .map((p) => p.trim())
            .filter(Boolean);

          for (const part of parts) {
            const method = methodLookup.get(part.toLowerCase());
            if (!method) {
              rowErrors.push({
                row: rowNumber,
                field: 'testParameters',
                errorType: 'not_found',
                message: `Test method "${part}" not found`,
                suggestion:
                  'Use a valid method name or code (e.g., "HPLC", "GC-MS")',
                value: part,
              });
            } else {
              testMethodIds.push(method.id);
            }
          }
        }
      }

      // -- If no errors on this row, add to valid list --
      if (rowErrors.length === 0 && product) {
        validRows.push({
          rowNumber,
          raw: row,
          product,
          lotNumber,
          manufacturingDate,
          expirationDate,
          sampleWeight,
          sampleVolume,
          unit,
          testMethodIds,
          sampleType,
          storageCondition,
        });
      } else {
        errors.push(...rowErrors);
      }
    }

    const totalRows = rows.length;
    const validCount = validRows.length;
    const errorRows = totalRows - validCount;
    const dataQualityScore =
      totalRows > 0 ? Math.round((validCount / totalRows) * 10000) / 100 : 0;

    // Build preview of first 10 rows with computed values
    const preview = validRows.slice(0, 10).map((r) => ({
      row: r.rowNumber,
      productCode: r.product.productCode,
      productName: r.product.name,
      lotNumber: r.lotNumber,
      manufacturingDate: r.manufacturingDate
        ? dayjs(r.manufacturingDate).format('YYYY-MM-DD')
        : '',
      expirationDate: r.expirationDate
        ? dayjs(r.expirationDate).format('YYYY-MM-DD')
        : '',
      sampleWeight: r.sampleWeight ?? '',
      sampleVolume: r.sampleVolume ?? '',
      unit: r.unit ?? '',
      testCount: r.testMethodIds.length,
    }));

    return {
      totalRows,
      validRows: validCount,
      errorRows,
      dataQualityScore,
      errors,
      preview,
    };
  }

  // ============================================================
  // 3. SUBMISSION (create batch + samples + tests in one transaction)
  // ============================================================

  /**
   * Create a batch with all samples and their tests from validated rows.
   */
  async submitBatch(
    validatedRows: ValidatedRow[],
    options: SubmitBatchOptions,
  ): Promise<BatchCreationResult> {
    if (!validatedRows || validatedRows.length === 0) {
      throw new BadRequestException('No valid rows to submit');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const batchNumber =
        options.batchNumber || (await this.generateBatchNumber());

      const batch = queryRunner.manager.create(SampleBatch, {
        batchNumber,
        customerId: options.customerId,
        purchaseOrder: options.purchaseOrder,
        dueDate: options.dueDate,
        priority: options.priority || PriorityLevel.MEDIUM,
        notes: options.notes,
        createdBy: options.userId,
        status: SampleStatus.SUBMITTED,
        submittedAt: new Date(),
      });

      const savedBatch = await queryRunner.manager.save(batch);

      const createdSamples: { id: string; sampleCode: string }[] = [];

      let counter = 1;
      for (const row of validatedRows) {
        const sampleCode = this.generateSampleCode(
          savedBatch.batchNumber,
          counter++,
        );

        const sample = queryRunner.manager.create(Sample, {
          sampleCode,
          batchId: savedBatch.id,
          productId: row.product.id,
          lotNumber: row.lotNumber,
          manufacturingDate: row.manufacturingDate,
          expirationDate: row.expirationDate,
          sampleType: row.sampleType,
          sampleWeight: row.sampleWeight,
          sampleVolume: row.sampleVolume,
          unit: row.unit,
          storageCondition: row.storageCondition,
          status: 'submitted',
        });

        const savedSample = await queryRunner.manager.save(sample);

        createdSamples.push({
          id: savedSample.id,
          sampleCode: savedSample.sampleCode,
        });

        // Create sample tests if any
        if (row.testMethodIds.length > 0) {
          const tests = row.testMethodIds.map((methodId, idx) =>
            queryRunner.manager.create(SampleTest, {
              sampleId: savedSample.id,
              methodId,
              status: 'pending',
              testOrder: idx,
            }),
          );
          await queryRunner.manager.save(tests);
        }
      }

      await queryRunner.commitTransaction();

      // Audit
      await this.auditService.log({
        userId: options.userId,
        action: AuditAction.CREATE,
        resourceType: 'sample_batch',
        resourceId: savedBatch.id,
        newValues: {
          batchNumber: savedBatch.batchNumber,
          sampleCount: validatedRows.length,
          source: 'bulk-submission',
        },
      });

      this.logger.log(
        `Created batch ${savedBatch.batchNumber} with ${validatedRows.length} samples`,
      );

      return {
        batchId: savedBatch.id,
        batchNumber: savedBatch.batchNumber,
        sampleCount: validatedRows.length,
        samples: createdSamples,
      };
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to create batch: ${err.message}`, err.stack);
      throw new BadRequestException(`Failed to create batch: ${err.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Convenience: validate + submit in one call.
   * Requires a customer ID and a column mapping.
   */
  async validateAndSubmit(
    rows: Record<string, any>[],
    columnMapping: ColumnMapping | Record<string, string>,
    options: SubmitBatchOptions,
  ): Promise<{ report: ValidationReport; result?: BatchCreationResult }> {
    const report = await this.validateRows(rows, columnMapping);

    if (report.dataQualityScore < this.MIN_QUALITY_SCORE) {
      throw new BadRequestException(
        `Data quality score (${report.dataQualityScore}%) is below the required threshold (${this.MIN_QUALITY_SCORE}%). Please fix the errors and try again.`,
      );
    }

    if (report.validRows === 0) {
      throw new BadRequestException('No valid rows to submit');
    }

    // Re-build validated rows (typed) for submission
    const validatedRows = await this.buildValidatedRows(rows, columnMapping);

    const result = await this.submitBatch(validatedRows, options);

    return { report, result };
  }

  // ============================================================
  // 4. HELPERS
  // ============================================================

  /**
   * Internal helper returning the validated row structures for submission.
   * Kept private — mirrors validateRows but returns the typed list.
   */
  private async buildValidatedRows(
    rows: Record<string, any>[],
    columnMapping: ColumnMapping | Record<string, string>,
  ): Promise<ValidatedRow[]> {
    const mapping = this.normalizeMapping(columnMapping);

    const productCodes = this.unique(
      rows.map((r) => this.trimStr(r[mapping.productCode!])).filter(Boolean),
    );
    const products = productCodes.length
      ? await this.productRepository.find({
          where: productCodes.map((code) => ({ productCode: code })),
        })
      : [];
    const productMap = new Map(products.map((p) => [p.productCode, p]));

    const allMethods = await this.testMethodRepository.find({
      where: { isCurrent: true },
    });
    const methodLookup = new Map<string, TestMethod>();
    for (const m of allMethods) {
      methodLookup.set(m.methodName.toLowerCase(), m);
      methodLookup.set(m.methodCode.toLowerCase(), m);
    }

    const result: ValidatedRow[] = [];
    const seenLotKeys = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const productCode = this.trimStr(row[mapping.productCode!]);
      const product = productMap.get(productCode);
      if (!product) continue;

      const lotNumber = this.trimStr(row[mapping.lotNumber!]);
      if (!lotNumber) continue;

      const lotKey = `${productCode}::${lotNumber}`.toLowerCase();
      if (seenLotKeys.has(lotKey)) continue;
      seenLotKeys.add(lotKey);

      const manufacturingDate = mapping.manufacturingDate
        ? this.parseDate(this.trimStr(row[mapping.manufacturingDate]))
        : undefined;
      const expirationDate = mapping.expirationDate
        ? this.parseDate(this.trimStr(row[mapping.expirationDate]))
        : undefined;

      const sampleWeight = mapping.sampleWeight
        ? Number(this.trimStr(row[mapping.sampleWeight])) || undefined
        : undefined;
      const sampleVolume = mapping.sampleVolume
        ? Number(this.trimStr(row[mapping.sampleVolume])) || undefined
        : undefined;
      const unit = mapping.unit ? this.trimStr(row[mapping.unit]) : undefined;
      const sampleType = mapping.sampleType
        ? this.trimStr(row[mapping.sampleType])
        : undefined;
      const storageCondition = mapping.storageCondition
        ? this.trimStr(row[mapping.storageCondition])
        : undefined;

      const testMethodIds: string[] = [];
      if (mapping.testParameters) {
        const raw = this.trimStr(row[mapping.testParameters]);
        if (raw) {
          const parts = raw
            .split(/[,;|]/)
            .map((p) => p.trim())
            .filter(Boolean);
          for (const part of parts) {
            const m = methodLookup.get(part.toLowerCase());
            if (m) testMethodIds.push(m.id);
          }
        }
      }

      result.push({
        rowNumber: i + 2,
        raw: row,
        product,
        lotNumber,
        manufacturingDate,
        expirationDate,
        sampleWeight,
        sampleVolume,
        unit,
        testMethodIds,
        sampleType,
        storageCondition,
      });
    }

    return result;
  }

  /**
   * Normalize a mapping that may have used snake_case or camelCase keys.
   */
  private normalizeMapping(
    input: ColumnMapping | Record<string, string>,
  ): ColumnMapping {
    const m: ColumnMapping = {
      productCode:
        (input as any).productCode ||
        (input as any).product_code ||
        '',
      lotNumber:
        (input as any).lotNumber || (input as any).lot_number || '',
      manufacturingDate:
        (input as any).manufacturingDate ||
        (input as any).manufacturing_date,
      expirationDate:
        (input as any).expirationDate || (input as any).expiration_date,
      sampleWeight:
        (input as any).sampleWeight || (input as any).sample_weight,
      sampleVolume:
        (input as any).sampleVolume || (input as any).sample_volume,
      unit: (input as any).unit,
      testParameters:
        (input as any).testParameters || (input as any).test_parameters,
      sampleType: (input as any).sampleType || (input as any).sample_type,
      storageCondition:
        (input as any).storageCondition ||
        (input as any).storage_condition,
    };
    return m;
  }

  private parseDate(value: string, format?: string): Date | undefined {
    if (!value) return undefined;

    // Try explicit format first
    if (format) {
      const d = dayjs(value, format, true);
      if (d.isValid()) return d.toDate();
    }

    // Try common formats
    const formats = [
      'YYYY-MM-DD',
      'MM/DD/YYYY',
      'DD/MM/YYYY',
      'YYYY/MM/DD',
      'DD-MM-YYYY',
    ];
    for (const fmt of formats) {
      const d = dayjs(value, fmt, true);
      if (d.isValid()) return d.toDate();
    }

    // Fallback to JS Date parsing
    const fallback = new Date(value);
    return Number.isNaN(fallback.getTime()) ? undefined : fallback;
  }

  private trimStr(v: any): string {
    if (v === null || v === undefined) return '';
    return String(v).trim();
  }

  private unique<T>(arr: T[]): T[] {
    return Array.from(new Set(arr));
  }

  private generateSampleCode(batchNumber: string, index: number): string {
    const suffix = index.toString().padStart(4, '0');
    return `${batchNumber}-S${suffix}`;
  }

  private async generateBatchNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const count = await this.batchRepository.count();
    return `BULK-${year}${month}-${(count + 1).toString().padStart(5, '0')}`;
  }

  // ============================================================
  // 5. TEMPLATE DOWNLOAD
  // ============================================================

  getTemplateCSV(): string {
    const headers = [
      'product_code',
      'lot_number',
      'manufacturing_date',
      'expiration_date',
      'sample_weight',
      'sample_volume',
      'unit',
      'sample_type',
      'storage_condition',
      'test_parameters',
    ];

    const exampleRows = [
      [
        'PROD-001',
        'LOT-2024-001',
        '2024-01-15',
        '2025-01-15',
        '10.5',
        '100',
        'g',
        'Finished',
        'Ambient',
        'HPLC,GC-MS',
      ],
      [
        'PROD-001',
        'LOT-2024-002',
        '2024-02-01',
        '2025-02-01',
        '12.0',
        '110',
        'g',
        'Finished',
        'Refrigerated',
        'HPLC',
      ],
    ];

    const lines = [headers.join(',')];
    for (const row of exampleRows) {
      lines.push(row.join(','));
    }
    return lines.join('\n') + '\n';
  }

  /**
   * Generate a template as an XLSX file (nicer than CSV for Excel users).
   */
  generateTemplateXLSX(): Buffer {
    const headers = [
      'product_code',
      'lot_number',
      'manufacturing_date',
      'expiration_date',
      'sample_weight',
      'sample_volume',
      'unit',
      'sample_type',
      'storage_condition',
      'test_parameters',
    ];

    const exampleRow = {
      product_code: 'PROD-001',
      lot_number: 'LOT-2024-001',
      manufacturing_date: '2024-01-15',
      expiration_date: '2025-01-15',
      sample_weight: 10.5,
      sample_volume: 100,
      unit: 'g',
      sample_type: 'Finished',
      storage_condition: 'Ambient',
      test_parameters: 'HPLC,GC-MS',
    };

    const worksheet = XLSX.utils.json_to_sheet([exampleRow], {
      header: headers,
    });

    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
      { wch: 8 },
      { wch: 15 },
      { wch: 18 },
      { wch: 25 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Samples');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  // ============================================================
  // 6. BATCH STATUS
  // ============================================================

  /**
   * Return a summary of a batch created via bulk submission.
   */
  async getBatchSummary(batchId: string) {
    const batch = await this.batchRepository.findOne({
      where: { id: batchId },
      relations: ['samples', 'samples.product', 'samples.tests'],
    });

    if (!batch) {
      throw new NotFoundException(`Batch ${batchId} not found`);
    }

    const totalSamples = batch.samples?.length || 0;
    const testsCount =
      batch.samples?.reduce((sum, s) => sum + (s.tests?.length || 0), 0) || 0;

    return {
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      status: batch.status,
      submittedAt: batch.submittedAt,
      dueDate: batch.dueDate,
      priority: batch.priority,
      totalSamples,
      totalTests: testsCount,
      samples: batch.samples?.map((s) => ({
        id: s.id,
        sampleCode: s.sampleCode,
        productName: s.product?.name,
        lotNumber: s.lotNumber,
        status: s.status,
        testCount: s.tests?.length || 0,
      })),
    };
  }
}