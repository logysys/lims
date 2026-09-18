import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';

import { CoaRecord } from './entities/coa-record.entity';
import { CoaTemplate } from './entities/coa-template.entity';
import { VerificationRecord } from '@modules/verification/entities/verification-record.entity';
import { Sample } from '@modules/samples/entities/sample.entity';
import { SampleBatch } from '@modules/samples/entities/sample-batch.entity';
import { AuditService } from '@modules/audit/audit.service';
import { AuditAction } from '@common/enums';
import { generateHash, generateHashChain } from '@common/utils/hash.util';

@Injectable()
export class CoaService {
  private readonly logger = new Logger(CoaService.name);

  constructor(
    @InjectRepository(CoaRecord)
    private readonly coaRepository: Repository<CoaRecord>,
    @InjectRepository(CoaTemplate)
    private readonly templateRepository: Repository<CoaTemplate>,
    @InjectRepository(VerificationRecord)
    private readonly verificationRepository: Repository<VerificationRecord>,
    @InjectRepository(Sample)
    private readonly sampleRepository: Repository<Sample>,
    @InjectRepository(SampleBatch)
    private readonly batchRepository: Repository<SampleBatch>,
    private readonly auditService: AuditService,
  ) {}

  async getTemplates() {
    return this.templateRepository.find({
      where: { isActive: true },
      order: { isDefault: 'DESC', name: 'ASC' },
    });
  }

  async createTemplate(data: Partial<CoaTemplate>, userId: string) {
    const template = this.templateRepository.create({
      ...data,
      createdBy: userId,
      updatedBy: userId,
    });
    return this.templateRepository.save(template);
  }

  async generateCoa(
    sampleId: string,
    templateId: string,
    userId: string,
    additionalNotes?: string,
  ): Promise<CoaRecord> {
    const sample = await this.sampleRepository.findOne({
      where: { id: sampleId },
      relations: ['batch', 'batch.customer', 'product', 'tests', 'tests.method'],
    });

    if (!sample) throw new NotFoundException('Sample not found');

    if (sample.coaGenerated) {
      throw new BadRequestException('COA already generated for this sample');
    }

    const template = await this.templateRepository.findOne({ where: { id: templateId } });
    if (!template) throw new NotFoundException('COA template not found');

    // Get previous COA for hash chain
    const lastCoa = await this.coaRepository.findOne({
      where: {},
      order: { chainPosition: 'DESC' },
    });

    const previousHash = lastCoa?.coaHash || 'GENESIS';
    const chainPosition = (lastCoa?.chainPosition || 0) + 1;

    const coaNumber = await this.generateCoaNumber();

    const content = {
      sampleCode: sample.sampleCode,
      lotNumber: sample.lotNumber,
      productName: sample.product?.name,
      manufacturer: sample.batch?.customer?.name,
      manufacturingDate: sample.manufacturingDate,
      expirationDate: sample.expirationDate,
      tests: sample.tests?.map((t) => ({
        method: t.method?.methodName,
        methodCode: t.method?.methodCode,
        result: t.resultValue,
        unit: t.resultUnit,
        status: t.resultStatus,
        completedAt: t.completedAt,
      })),
      additionalNotes,
      generatedAt: new Date().toISOString(),
    };

    const coaHash = generateHashChain(previousHash, JSON.stringify(content));

    const coa = this.coaRepository.create({
      coaNumber,
      sampleId,
      batchId: sample.batchId,
      templateId,
      content,
      coaHash,
      previousCoaHash: previousHash,
      chainPosition,
      releasedAt: new Date(),
      version: 1,
    });

    const savedCoa = await this.coaRepository.save(coa);

    // Generate QR code
    const publicUrl = `${process.env.PUBLIC_VERIFY_URL || 'http://localhost:3005'}/verify/${savedCoa.id}`;
    const qrCodeDataUrl = await QRCode.toDataURL(publicUrl);

    await this.coaRepository.update(savedCoa.id, {
      publicUrl,
      qrCodeUrl: qrCodeDataUrl,
      qrCodeHash: generateHash(publicUrl),
    });

    // Update sample
    await this.sampleRepository.update(sampleId, {
      coaGenerated: true,
      coaUrl: publicUrl,
      qrCodeUrl: qrCodeDataUrl,
      qrCodeHash: generateHash(publicUrl),
      status: 'released',
    });

    // Create verification record
    await this.verificationRepository.save(
      this.verificationRepository.create({
        coaId: savedCoa.id,
        productName: sample.product?.name || 'Unknown',
        manufacturerName: sample.batch?.customer?.name || 'Unknown',
        manufacturerId: sample.batch?.customerId,
        lotNumber: sample.lotNumber,
        compoundNames: sample.tests?.map((t) => t.method?.methodName).filter(Boolean) as string[],
        testResults: content.tests,
        verificationStatus: 'verified',
        publicUrl,
        qrCodeUrl: qrCodeDataUrl,
        qrCodeData: publicUrl,
      }),
    );

    await this.auditService.log({
      userId,
      action: AuditAction.RELEASE,
      resourceType: 'coa',
      resourceId: savedCoa.id,
      newValues: { coaNumber, sampleId, coaHash },
    });

    return this.getCoaById(savedCoa.id) as Promise<CoaRecord>;
  }

  async getCoaById(id: string): Promise<CoaRecord | null> {
    return this.coaRepository.findOne({ where: { id } });
  }

  async findAll(options: { page?: number; limit?: number; sampleId?: string }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const qb = this.coaRepository.createQueryBuilder('coa');

    if (options.sampleId) {
      qb.andWhere('coa.sampleId = :sampleId', { sampleId: options.sampleId });
    }

    qb.orderBy('coa.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async batchGenerate(
    sampleIds: string[],
    templateId: string,
    userId: string,
  ): Promise<CoaRecord[]> {
    const results: CoaRecord[] = [];
    for (const sampleId of sampleIds) {
      try {
        const coa = await this.generateCoa(sampleId, templateId, userId);
        results.push(coa);
      } catch (err) {
        this.logger.error(`Failed to generate COA for sample ${sampleId}: ${err.message}`);
      }
    }
    return results;
  }

  private async generateCoaNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.coaRepository.count();
    return `COA-${year}-${(count + 1).toString().padStart(6, '0')}`;
  }

  async verifyChain(): Promise<{ valid: boolean; checked: number }> {
    const records = await this.coaRepository.find({
      order: { chainPosition: 'ASC' },
    });

    let previousHash = 'GENESIS';
    for (let i = 0; i < records.length; i++) {
      if (records[i].previousCoaHash !== previousHash) {
        return { valid: false, checked: i };
      }
      previousHash = records[i].coaHash;
    }

    return { valid: true, checked: records.length };
  }
}