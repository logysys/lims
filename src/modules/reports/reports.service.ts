import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Sample } from '@modules/samples/entities/sample.entity';
import { SampleTest } from '@modules/testing/entities/sample-test.entity';
import { CoaRecord } from '@modules/coa/entities/coa-record.entity';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Sample)
    private readonly sampleRepository: Repository<Sample>,
    @InjectRepository(SampleTest)
    private readonly testRepository: Repository<SampleTest>,
    @InjectRepository(CoaRecord)
    private readonly coaRepository: Repository<CoaRecord>,
  ) {}

  async getDashboardMetrics(orgId?: string, from?: Date, to?: Date) {
    const dateFilter = {
      from: from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: to || new Date(),
    };

    const qb = this.sampleRepository
      .createQueryBuilder('sample')
      .leftJoin('sample.batch', 'batch')
      .where('sample.createdAt BETWEEN :from AND :to', dateFilter);

    if (orgId) {
      qb.andWhere('batch.customerId = :orgId', { orgId });
    }

    const total = await qb.getCount();

    const statusCounts = await this.sampleRepository
      .createQueryBuilder('sample')
      .leftJoin('sample.batch', 'batch')
      .select('sample.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('sample.createdAt BETWEEN :from AND :to', dateFilter)
      .groupBy('sample.status')
      .getRawMany();

    // Calculate average TAT
    const tatResult = await this.sampleRepository
      .createQueryBuilder('sample')
      .select(
        'AVG(EXTRACT(EPOCH FROM (sample.updatedAt - sample.createdAt)) / 86400)',
        'avgDays',
      )
      .where('sample.status = :status', { status: 'released' })
      .andWhere('sample.createdAt BETWEEN :from AND :to', dateFilter)
      .getRawOne();

    // Pass/fail rate
    const [passed, failed] = await Promise.all([
      this.testRepository.count({ where: { resultStatus: 'pass' } }),
      this.testRepository.count({ where: { resultStatus: 'fail' } }),
    ]);

    return {
      total,
      statusCounts: statusCounts.reduce(
        (acc, row) => ({ ...acc, [row.status]: parseInt(row.count, 10) }),
        {},
      ),
      averageTAT: parseFloat(tatResult?.avgDays || '0').toFixed(2),
      passRate: passed + failed > 0 ? ((passed / (passed + failed)) * 100).toFixed(2) : '0',
      failCount: failed,
      passCount: passed,
    };
  }

  async getTrendData(
    productId: string,
    parameter: string,
    from?: Date,
    to?: Date,
  ) {
    const qb = this.testRepository
      .createQueryBuilder('test')
      .leftJoin('test.sample', 'sample')
      .leftJoin('test.method', 'method')
      .select('sample.lotNumber', 'lotNumber')
      .addSelect('sample.createdAt', 'date')
      .addSelect('test.resultValue', 'value')
      .addSelect('test.resultUnit', 'unit')
      .where('sample.productId = :productId', { productId })
      .andWhere('method.methodName ILIKE :param', { param: `%${parameter}%` });

    if (from) {
      qb.andWhere('sample.createdAt >= :from', { from });
    }
    if (to) {
      qb.andWhere('sample.createdAt <= :to', { to });
    }

    qb.orderBy('sample.createdAt', 'ASC');

    return qb.getRawMany();
  }

  async exportAuditTrailToExcel(filters: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Audit Trail');

    sheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Timestamp', key: 'createdAt', width: 25 },
      { header: 'User', key: 'userEmail', width: 30 },
      { header: 'Action', key: 'action', width: 15 },
      { header: 'Resource Type', key: 'resourceType', width: 20 },
      { header: 'Resource ID', key: 'resourceId', width: 40 },
      { header: 'IP Address', key: 'ipAddress', width: 20 },
      { header: 'Hash', key: 'eventHash', width: 40 },
    ];

    // This is a placeholder - actual implementation would query audit repository
    sheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportSamplesToExcel(orgId?: string, status?: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Samples');

    sheet.columns = [
      { header: 'Sample Code', key: 'sampleCode', width: 20 },
      { header: 'Batch', key: 'batchNumber', width: 20 },
      { header: 'Product', key: 'productName', width: 30 },
      { header: 'Lot Number', key: 'lotNumber', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Created', key: 'createdAt', width: 20 },
      { header: 'Completed', key: 'completedAt', width: 20 },
    ];

    const qb = this.sampleRepository
      .createQueryBuilder('sample')
      .leftJoinAndSelect('sample.batch', 'batch')
      .leftJoinAndSelect('sample.product', 'product');

    if (orgId) {
      qb.andWhere('batch.customerId = :orgId', { orgId });
    }
    if (status) {
      qb.andWhere('sample.status = :status', { status });
    }

    const samples = await qb.getMany();

    samples.forEach((s) => {
      sheet.addRow({
        sampleCode: s.sampleCode,
        batchNumber: s.batch?.batchNumber,
        productName: s.product?.name,
        lotNumber: s.lotNumber,
        status: s.status,
        createdAt: s.createdAt?.toISOString(),
        completedAt: s.tests?.[0]?.completedAt?.toISOString(),
      });
    });

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async getCOAStats(from?: Date, to?: Date) {
    const dateFilter = {
      from: from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: to || new Date(),
    };

    const total = await this.coaRepository
      .createQueryBuilder('coa')
      .where('coa.createdAt BETWEEN :from AND :to', dateFilter)
      .getCount();

    const releasedToday = await this.coaRepository
      .createQueryBuilder('coa')
      .where('DATE(coa.releasedAt) = CURRENT_DATE')
      .getCount();

    return { total, releasedToday };
  }
}