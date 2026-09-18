import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditTrail } from './entities/audit-trail.entity';
import { generateHashChain } from '@common/utils/hash.util';

interface AuditLogParams {
  userId?: string;
  userEmail?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  wasSigned?: boolean;
  signatureId?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditTrail)
    private readonly auditRepository: Repository<AuditTrail>,
  ) {}

  async log(params: AuditLogParams): Promise<AuditTrail> {
    try {
      // Get the last audit entry for hash chaining
      const lastEntry = await this.auditRepository.findOne({
        where: {},
        order: { id: 'DESC' },
      });

      const previousHash = lastEntry?.eventHash || 'GENESIS';

      const eventData = JSON.stringify({
        userId: params.userId,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        timestamp: new Date().toISOString(),
      });

      const eventHash = generateHashChain(previousHash, eventData);

      const entry = this.auditRepository.create({
        userId: params.userId,
        userEmail: params.userEmail,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        oldValues: params.oldValues,
        newValues: params.newValues,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        previousHash,
        eventHash,
        wasSigned: params.wasSigned || false,
        signatureId: params.signatureId,
      });

      return this.auditRepository.save(entry);
    } catch (error) {
      this.logger.error(`Failed to write audit log: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(options: {
    page?: number;
    limit?: number;
    resourceType?: string;
    resourceId?: string;
    userId?: string;
    action?: string;
    from?: Date;
    to?: Date;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const qb = this.auditRepository.createQueryBuilder('audit');

    if (options.resourceType) {
      qb.andWhere('audit.resourceType = :resourceType', {
        resourceType: options.resourceType,
      });
    }
    if (options.resourceId) {
      qb.andWhere('audit.resourceId = :resourceId', {
        resourceId: options.resourceId,
      });
    }
    if (options.userId) {
      qb.andWhere('audit.userId = :userId', { userId: options.userId });
    }
    if (options.action) {
      qb.andWhere('audit.action = :action', { action: options.action });
    }
    if (options.from) {
      qb.andWhere('audit.createdAt >= :from', { from: options.from });
    }
    if (options.to) {
      qb.andWhere('audit.createdAt <= :to', { to: options.to });
    }

    qb.orderBy('audit.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async verifyChain(): Promise<{ valid: boolean; checked: number }> {
    const entries = await this.auditRepository.find({
      order: { id: 'ASC' },
    });

    let previousHash = 'GENESIS';
    for (const entry of entries) {
      if (entry.previousHash !== previousHash) {
        return { valid: false, checked: entries.indexOf(entry) };
      }
      previousHash = entry.eventHash;
    }

    return { valid: true, checked: entries.length };
  }
}