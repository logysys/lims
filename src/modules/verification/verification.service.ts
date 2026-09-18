import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VerificationRecord } from './entities/verification-record.entity';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(VerificationRecord)
    private readonly verificationRepository: Repository<VerificationRecord>,
  ) {}

  async search(query: string, scope?: string) {
    const qb = this.verificationRepository.createQueryBuilder('v');

    if (scope === 'products') {
      qb.where('v.productName ILIKE :query', { query: `%${query}%` });
    } else if (scope === 'manufacturers') {
      qb.where('v.manufacturerName ILIKE :query', { query: `%${query}%` });
    } else if (scope === 'lots') {
      qb.where('v.lotNumber ILIKE :query', { query: `%${query}%` });
    } else {
      qb.where(
        '(v.productName ILIKE :query OR v.manufacturerName ILIKE :query OR v.lotNumber ILIKE :query)',
        { query: `%${query}%` },
      );
    }

    qb.andWhere('v.verificationStatus = :status', { status: 'verified' });
    qb.orderBy('v.lastVerifiedAt', 'DESC').take(50);

    return qb.getMany();
  }

  async getByCoaId(coaId: string) {
    const record = await this.verificationRepository.findOne({
      where: { coaId },
    });
    if (!record) throw new NotFoundException('Verification record not found');

    // Increment view count
    await this.verificationRepository.increment({ id: record.id }, 'viewCount', 1);

    return record;
  }

  async getById(id: string) {
    const record = await this.verificationRepository.findOne({ where: { id } });
    if (!record) throw new NotFoundException('Verification record not found');
    return record;
  }

  async getByLotNumber(lotNumber: string) {
    const records = await this.verificationRepository.find({
      where: { lotNumber, verificationStatus: 'verified' },
      order: { lastVerifiedAt: 'DESC' },
    });
    return records;
  }

  async recordScan(id: string) {
    await this.verificationRepository.increment({ id }, 'scanCount', 1);
  }

  async recordDownload(id: string) {
    await this.verificationRepository.increment({ id }, 'downloadCount', 1);
  }

  async getByBadgeCode(badgeCode: string) {
    // This would join with verified_badges table
    return this.verificationRepository
      .createQueryBuilder('v')
      .leftJoin('verified_badges', 'b', 'b.verification_record_id = v.id')
      .where('b.badge_code = :badgeCode', { badgeCode })
      .getOne();
  }
}