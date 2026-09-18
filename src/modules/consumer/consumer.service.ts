import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { VerificationRecord } from '@modules/verification/entities/verification-record.entity';
import { VerifiedBadge } from '@modules/badges/entities/verified-badge.entity';
import { Product } from '@modules/products/entities/product.entity';

@Injectable()
export class ConsumerService {
  constructor(
    @InjectRepository(VerificationRecord)
    private readonly verificationRepository: Repository<VerificationRecord>,
    @InjectRepository(VerifiedBadge)
    private readonly badgeRepository: Repository<VerifiedBadge>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async browseProducts(options: {
    page?: number;
    limit?: number;
    category?: string;
    sort?: 'featured' | 'newest' | 'popular';
    search?: string;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 20;

    const qb = this.verificationRepository.createQueryBuilder('v');

    if (options.category) {
      qb.andWhere('v.productName ILIKE :category', {
        category: `%${options.category}%`,
      });
    }
    if (options.search) {
      qb.andWhere(
        '(v.productName ILIKE :s OR v.manufacturerName ILIKE :s)',
        { s: `%${options.search}%` },
      );
    }

    qb.andWhere('v.verificationStatus = :status', { status: 'verified' });

    switch (options.sort) {
      case 'newest':
        qb.orderBy('v.createdAt', 'DESC');
        break;
      case 'popular':
        qb.orderBy('v.viewCount', 'DESC');
        break;
      default:
        qb.orderBy('v.lastVerifiedAt', 'DESC');
    }

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async getProductDetail(productName: string) {
    const records = await this.verificationRepository.find({
      where: { productName },
      order: { createdAt: 'DESC' },
    });

    if (records.length === 0) {
      throw new NotFoundException('Product not found');
    }

    return {
      productName,
      manufacturer: records[0].manufacturerName,
      totalLots: records.length,
      lots: records.map((r) => ({
        lotNumber: r.lotNumber,
        verifiedAt: r.lastVerifiedAt,
        status: r.verificationStatus,
        coaUrl: r.publicUrl,
      })),
    };
  }

  async getBadgeDetail(badgeCode: string) {
    const badge = await this.badgeRepository.findOne({
      where: { badgeCode },
    });
    if (!badge) throw new NotFoundException('Badge not found');

    const verification = badge.verificationRecordId
      ? await this.verificationRepository.findOne({
          where: { id: badge.verificationRecordId },
        })
      : null;

    return {
      badge: {
        code: badge.badgeCode,
        status: badge.status,
        validFrom: badge.validFrom,
        validUntil: badge.validUntil,
      },
      verification,
    };
  }

  async getFeaturedCollections() {
    const [newest, popular, topManufacturers] = await Promise.all([
      this.verificationRepository.find({
        where: { verificationStatus: 'verified' },
        order: { createdAt: 'DESC' },
        take: 10,
      }),
      this.verificationRepository.find({
        where: { verificationStatus: 'verified' },
        order: { viewCount: 'DESC' },
        take: 10,
      }),
      this.verificationRepository
        .createQueryBuilder('v')
        .select('v.manufacturerName', 'name')
        .addSelect('COUNT(*)', 'count')
        .groupBy('v.manufacturerName')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany(),
    ]);

    return {
      newestVerifications: newest,
      mostViewed: popular,
      topManufacturers,
    };
  }
}