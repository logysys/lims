import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';

import { Sample } from './entities/sample.entity';
import { SampleBatch } from './entities/sample-batch.entity';
import { SampleTest } from '@modules/testing/entities/sample-test.entity';
import { AuditService } from '@modules/audit/audit.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { CreateSampleDto } from './dto/create-sample.dto';
import { SampleStatus, AuditAction, UserRole } from '@common/enums';
import { generateHash } from '@common/utils/hash.util';

@Injectable()
export class SamplesService {
  private readonly logger = new Logger(SamplesService.name);

  constructor(
    @InjectRepository(Sample)
    private readonly sampleRepository: Repository<Sample>,
    @InjectRepository(SampleBatch)
    private readonly batchRepository: Repository<SampleBatch>,
    @InjectRepository(SampleTest)
    private readonly sampleTestRepository: Repository<SampleTest>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createBatch(dto: CreateBatchDto, userId: string): Promise<SampleBatch> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const batch = queryRunner.manager.create(SampleBatch, {
        batchNumber: dto.batchNumber,
        customerId: dto.customerId,
        purchaseOrder: dto.purchaseOrder,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        priority: dto.priority,
        notes: dto.notes,
        createdBy: userId,
        status: SampleStatus.SUBMITTED,
        submittedAt: new Date(),
      });

      const savedBatch = await queryRunner.manager.save(batch);

      // Create individual samples
      let counter = 1;
      for (const sampleItem of dto.samples) {
        const sampleCode = this.generateSampleCode(savedBatch.batchNumber, counter++);

        const sample = queryRunner.manager.create(Sample, {
          sampleCode,
          batchId: savedBatch.id,
          productId: sampleItem.productId,
          lotNumber: sampleItem.lotNumber,
          manufacturingDate: sampleItem.manufacturingDate
            ? new Date(sampleItem.manufacturingDate)
            : undefined,
          expirationDate: sampleItem.expirationDate
            ? new Date(sampleItem.expirationDate)
            : undefined,
          sampleWeight: sampleItem.sampleWeight,
          sampleVolume: sampleItem.sampleVolume,
          unit: sampleItem.unit,
          status: 'submitted',
        });

        const savedSample = await queryRunner.manager.save(sample);

        // Create sample tests
        if (sampleItem.testMethodIds && sampleItem.testMethodIds.length > 0) {
          const tests = sampleItem.testMethodIds.map((methodId, idx) =>
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

      await this.auditService.log({
        userId,
        action: AuditAction.CREATE,
        resourceType: 'sample_batch',
        resourceId: savedBatch.id,
        newValues: { batchNumber: savedBatch.batchNumber, sampleCount: dto.samples.length },
      });

      this.eventEmitter.emit('batch.created', { batch: savedBatch });

      return this.findBatchById(savedBatch.id) as Promise<SampleBatch>;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to create batch: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createSample(dto: CreateSampleDto, userId: string): Promise<Sample> {
    const batch = await this.batchRepository.findOne({
      where: { customerId: dto.customerId, status: SampleStatus.DRAFT },
    });

    let batchId: string;
    let batchNumber: string;

    if (batch) {
      batchId = batch.id;
      batchNumber = batch.batchNumber;
    } else {
      batchNumber = `BATCH-${Date.now()}`;
      const newBatch = this.batchRepository.create({
        batchNumber,
        customerId: dto.customerId,
        purchaseOrder: dto.purchaseOrder,
        status: SampleStatus.SUBMITTED,
        submittedAt: new Date(),
        createdBy: userId,
        priority: dto.priority,
        notes: dto.notes,
      });
      const savedBatch = await this.batchRepository.save(newBatch);
      batchId = savedBatch.id;
    }

    const sampleCode = this.generateSampleCode(batchNumber, Date.now() % 10000);

    const sample = this.sampleRepository.create({
      sampleCode,
      batchId,
      productId: dto.productId,
      lotNumber: dto.lotNumber,
      manufacturingDate: dto.manufacturingDate ? new Date(dto.manufacturingDate) : undefined,
      expirationDate: dto.expirationDate ? new Date(dto.expirationDate) : undefined,
      sampleType: dto.sampleType,
      sampleWeight: dto.sampleWeight,
      sampleVolume: dto.sampleVolume,
      unit: dto.unit,
      storageCondition: dto.storageCondition,
      status: 'submitted',
    });

    const savedSample = await this.sampleRepository.save(sample);

    if (dto.testMethodIds && dto.testMethodIds.length > 0) {
      const tests = dto.testMethodIds.map((methodId, idx) =>
        this.sampleTestRepository.create({
          sampleId: savedSample.id,
          methodId,
          status: 'pending',
          testOrder: idx,
        }),
      );
      await this.sampleTestRepository.save(tests);
    }

    await this.auditService.log({
      userId,
      action: AuditAction.CREATE,
      resourceType: 'sample',
      resourceId: savedSample.id,
      newValues: { sampleCode: savedSample.sampleCode, lotNumber: savedSample.lotNumber },
    });

    return this.findById(savedSample.id) as Promise<Sample>;
  }

  async findById(id: string): Promise<Sample | null> {
    return this.sampleRepository.findOne({
      where: { id },
      relations: ['batch', 'product', 'tests', 'tests.method'],
    });
  }

  async findBatchById(id: string): Promise<SampleBatch | null> {
    return this.batchRepository.findOne({
      where: { id },
      relations: ['customer', 'samples', 'samples.product', 'samples.tests'],
    });
  }

  async findAll(options: {
    page?: number;
    limit?: number;
    status?: string;
    customerId?: string;
    batchId?: string;
    search?: string;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const qb = this.sampleRepository
      .createQueryBuilder('sample')
      .leftJoinAndSelect('sample.batch', 'batch')
      .leftJoinAndSelect('sample.product', 'product')
      .leftJoinAndSelect('sample.tests', 'tests');

    if (options.status) {
      qb.andWhere('sample.status = :status', { status: options.status });
    }
    if (options.customerId) {
      qb.andWhere('batch.customerId = :customerId', { customerId: options.customerId });
    }
    if (options.batchId) {
      qb.andWhere('sample.batchId = :batchId', { batchId: options.batchId });
    }
    if (options.search) {
      qb.andWhere(
        '(sample.sampleCode ILIKE :search OR sample.lotNumber ILIKE :search OR product.name ILIKE :search)',
        { search: `%${options.search}%` },
      );
    }

    qb.orderBy('sample.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async updateStatus(
    sampleId: string,
    newStatus: string,
    userId: string,
    justification?: string,
  ): Promise<Sample> {
    const sample = await this.findById(sampleId);
    if (!sample) throw new NotFoundException('Sample not found');

    const oldStatus = sample.status;

    if (sample.batch) {
      await this.batchRepository.update(sample.batchId, {
        status: newStatus as SampleStatus,
      });
    }

    await this.sampleRepository.update(sampleId, { status: newStatus });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      resourceType: 'sample',
      resourceId: sampleId,
      oldValues: { status: oldStatus },
      newValues: { status: newStatus, justification },
    });

    this.eventEmitter.emit('sample.status.changed', {
      sampleId,
      fromStatus: oldStatus,
      toStatus: newStatus,
      userId,
    });

    return this.findById(sampleId) as Promise<Sample>;
  }

  async recordChainOfCustody(
    sampleId: string,
    data: {
      fromLocation?: string;
      toLocation: string;
      reason: string;
      notes?: string;
    },
    userId: string,
  ) {
    const sample = await this.findById(sampleId);
    if (!sample) throw new NotFoundException('Sample not found');

    await this.sampleRepository.update(sampleId, {
      currentLocation: data.toLocation,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      resourceType: 'sample_chain_of_custody',
      resourceId: sampleId,
      oldValues: { location: sample.currentLocation },
      newValues: {
        location: data.toLocation,
        reason: data.reason,
        notes: data.notes,
      },
    });

    return this.findById(sampleId);
  }

  async assignToTests(sampleId: string, methodIds: string[], userId: string) {
    const sample = await this.findById(sampleId);
    if (!sample) throw new NotFoundException('Sample not found');

    const tests = methodIds.map((methodId, idx) =>
      this.sampleTestRepository.create({
        sampleId,
        methodId,
        status: 'pending',
        testOrder: idx,
      }),
    );

    await this.sampleTestRepository.save(tests);

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      resourceType: 'sample',
      resourceId: sampleId,
      newValues: { assignedTests: methodIds },
    });

    return this.findById(sampleId);
  }

  async assignStorageLocation(sampleId: string, location: string, userId: string) {
    const sample = await this.findById(sampleId);
    if (!sample) throw new NotFoundException('Sample not found');

    await this.sampleRepository.update(sampleId, { currentLocation: location });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      resourceType: 'sample',
      resourceId: sampleId,
      oldValues: { currentLocation: sample.currentLocation },
      newValues: { currentLocation: location },
    });

    return this.findById(sampleId);
  }

  private generateSampleCode(batchNumber: string, index: number): string {
    const suffix = index.toString().padStart(4, '0');
    return `${batchNumber}-S${suffix}`;
  }

  async getMyQueue(userId: string) {
    return this.sampleRepository
      .createQueryBuilder('sample')
      .leftJoinAndSelect('sample.batch', 'batch')
      .leftJoinAndSelect('sample.product', 'product')
      .leftJoinAndSelect('sample.tests', 'tests')
      .where('tests.status = :status', { status: 'pending' })
      .andWhere('batch.status IN (:...statuses)', {
        statuses: ['accessioned', 'preparing', 'testing'],
      })
      .orderBy('batch.priority', 'DESC')
      .addOrderBy('batch.dueDate', 'ASC')
      .take(50)
      .getMany();
  }

  async getDashboardStats() {
    const [total, pending, inTesting, completed, released] = await Promise.all([
      this.sampleRepository.count(),
      this.sampleRepository.count({ where: { status: 'submitted' } }),
      this.sampleRepository.count({ where: { status: 'testing' } }),
      this.sampleRepository.count({ where: { status: 'approved' } }),
      this.sampleRepository.count({ where: { status: 'released' } }),
    ]);

    return {
      total,
      pending,
      inTesting,
      completed,
      released,
      todayCount: await this.sampleRepository
        .createQueryBuilder('sample')
        .where('DATE(sample.createdAt) = CURRENT_DATE')
        .getCount(),
    };
  }
}