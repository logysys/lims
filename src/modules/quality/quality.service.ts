import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';

import { QualityReview } from './entities/quality-review.entity';
import { ElectronicSignature } from './entities/electronic-signature.entity';
import { Sample } from '@modules/samples/entities/sample.entity';
import { AuditService } from '@modules/audit/audit.service';
import { ReviewType, ReviewDecision, AuditAction, SampleStatus } from '@common/enums';
import { generateRecordHash } from '@common/utils/hash.util';

@Injectable()
export class QualityService {
  constructor(
    @InjectRepository(QualityReview)
    private readonly reviewRepository: Repository<QualityReview>,
    @InjectRepository(ElectronicSignature)
    private readonly signatureRepository: Repository<ElectronicSignature>,
    @InjectRepository(Sample)
    private readonly sampleRepository: Repository<Sample>,
    private readonly auditService: AuditService,
  ) {}

  async getPendingReviews() {
    return this.sampleRepository.find({
      where: { status: 'qa_review' },
      relations: ['batch', 'product', 'tests', 'tests.method'],
      order: { createdAt: 'ASC' },
    });
  }

  async getReviewHistory(sampleId: string) {
    return this.reviewRepository.find({
      where: { sampleId },
      relations: ['reviewer'],
      order: { reviewedAt: 'DESC' },
    });
  }

  async submitReview(
    sampleId: string,
    dto: {
      reviewType: ReviewType;
      decision: ReviewDecision;
      comments?: string;
      signatureMeaning: string;
      stepUpMethod: string;
      ipAddress?: string;
      userAgent?: string;
    },
    userId: string,
  ) {
    const sample = await this.sampleRepository.findOne({
      where: { id: sampleId },
      relations: ['tests', 'tests.method'],
    });

    if (!sample) throw new NotFoundException('Sample not found');

    // Create electronic signature
    const recordHash = generateRecordHash({
      sampleId,
      status: sample.status,
      reviewedAt: new Date().toISOString(),
    });

    const signatureHash = crypto
      .createHash('sha256')
      .update(`${userId}:${recordHash}:${dto.signatureMeaning}`)
      .digest('hex');

    const signature = this.signatureRepository.create({
      userId,
      recordId: sampleId,
      recordType: 'sample',
      signMeaning: dto.signatureMeaning,
      signatureHash,
      stepUpVerified: true,
      stepUpMethod: dto.stepUpMethod,
      stepUpTimestamp: new Date(),
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
      boundRecordHash: recordHash,
      recordVersion: 1,
    });

    const savedSignature = await this.signatureRepository.save(signature);

    // Create review record
    const review = this.reviewRepository.create({
      sampleId,
      reviewType: dto.reviewType,
      reviewerId: userId,
      decision: dto.decision,
      comments: dto.comments,
      signatureVerified: true,
      signatureHash,
      signingKeyId: savedSignature.id,
    });

    const savedReview = await this.reviewRepository.save(review);

    // Update sample status
    let newStatus = sample.status;
    if (dto.decision === ReviewDecision.APPROVED) {
      newStatus = dto.reviewType === ReviewType.QA_REVIEW ? SampleStatus.APPROVED : SampleStatus.QA_REVIEW;
    } else if (dto.decision === ReviewDecision.REJECTED) {
      newStatus = 'rejected';
    } else if (dto.decision === ReviewDecision.NEEDS_REVISION) {
      newStatus = SampleStatus.TESTING;
    }

    await this.sampleRepository.update(sampleId, { status: newStatus });

    await this.auditService.log({
      userId,
      action: AuditAction.SIGN,
      resourceType: 'quality_review',
      resourceId: savedReview.id,
      newValues: {
        sampleId,
        decision: dto.decision,
        reviewType: dto.reviewType,
        newStatus,
      },
      wasSigned: true,
      signatureId: savedSignature.id,
    });

    return {
      review: savedReview,
      signature: {
        id: savedSignature.id,
        hash: signatureHash,
        signedAt: savedSignature.signedAt,
      },
    };
  }

  async createRejection(
    sampleId: string,
    dto: {
      reason: string;
      correctiveActions: string;
      assignTo?: string;
      requiresRetest?: boolean;
      notifyCustomer?: boolean;
    },
    userId: string,
  ) {
    const sample = await this.sampleRepository.findOne({ where: { id: sampleId } });
    if (!sample) throw new NotFoundException('Sample not found');

    const review = this.reviewRepository.create({
      sampleId,
      reviewType: ReviewType.QA_REVIEW,
      reviewerId: userId,
      decision: ReviewDecision.REJECTED,
      comments: `${dto.reason}\n\nCorrective Actions: ${dto.correctiveActions}`,
    });

    const saved = await this.reviewRepository.save(review);

    await this.sampleRepository.update(sampleId, {
      status: 'rejected',
      isRetest: dto.requiresRetest || false,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.REJECT,
      resourceType: 'sample',
      resourceId: sampleId,
      newValues: dto,
    });

    return saved;
  }

  async getSignatureById(id: string) {
    return this.signatureRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async verifySignature(signatureId: string) {
    const signature = await this.signatureRepository.findOne({
      where: { id: signatureId },
    });
    if (!signature) throw new NotFoundException('Signature not found');

    const record = await this.sampleRepository.findOne({
      where: { id: signature.recordId },
    });

    if (!record) {
      return { valid: false, reason: 'Record not found' };
    }

    const currentHash = generateRecordHash({
      sampleId: signature.recordId,
      status: record.status,
      reviewedAt: signature.signedAt.toISOString(),
    });

    return {
      valid: currentHash === signature.boundRecordHash,
      signatureHash: signature.signatureHash,
      signedAt: signature.signedAt,
    };
  }
}