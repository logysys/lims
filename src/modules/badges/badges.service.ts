import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VerifiedBadge } from './entities/verified-badge.entity';
import { generateBadgeCode, generateHash } from '@common/utils/hash.util';

@Injectable()
export class BadgesService {
  constructor(
    @InjectRepository(VerifiedBadge)
    private readonly badgeRepository: Repository<VerifiedBadge>,
  ) {}

  async generate(data: {
    productId: string;
    verificationRecordId?: string;
    badgeType?: string;
    displayText?: string;
    expiryYears?: number;
  }) {
    const badgeCode = generateBadgeCode();
    const validFrom = new Date();
    const validUntil = data.expiryYears
      ? new Date(validFrom.getFullYear() + data.expiryYears, validFrom.getMonth(), validFrom.getDate())
      : undefined;

    const badge = this.badgeRepository.create({
      productId: data.productId,
      verificationRecordId: data.verificationRecordId,
      badgeCode,
      badgeUrl: `${process.env.PUBLIC_VERIFY_URL || 'http://localhost:3005'}/badge/${badgeCode}`,
      status: 'active',
      validFrom,
      validUntil,
    });

    return this.badgeRepository.save(badge);
  }

  async findAll(options: { page?: number; limit?: number; status?: string }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const qb = this.badgeRepository.createQueryBuilder('badge');

    if (options.status) {
      qb.andWhere('badge.status = :status', { status: options.status });
    }

    qb.orderBy('badge.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async getById(id: string) {
    const badge = await this.badgeRepository.findOne({ where: { id } });
    if (!badge) throw new NotFoundException('Badge not found');
    return badge;
  }

  async getByCode(code: string) {
    const badge = await this.badgeRepository.findOne({ where: { badgeCode: code } });
    if (!badge) throw new NotFoundException('Badge not found');

    if (badge.validUntil && badge.validUntil < new Date()) {
      await this.badgeRepository.update(badge.id, { status: 'expired' });
      badge.status = 'expired';
    }

    return badge;
  }

  async recordView(id: string) {
    await this.badgeRepository.increment({ id }, 'viewCount', 1);
  }

  async recordClick(id: string) {
    await this.badgeRepository.increment({ id }, 'clickCount', 1);
  }

  async revoke(id: string) {
    await this.badgeRepository.update(id, { status: 'revoked' });
    return this.getById(id);
  }
}