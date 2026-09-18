import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ReviewType, ReviewDecision } from '@common/enums';
import { User } from '@modules/users/entities/user.entity';

@Entity('quality_reviews')
export class QualityReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sample_id', type: 'uuid' })
  sampleId: string;

  @Column({ name: 'review_type', type: 'enum', enum: ReviewType })
  reviewType: ReviewType;

  @Column({ name: 'reviewer_id', type: 'uuid' })
  reviewerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;

  @Column({ name: 'reviewed_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  reviewedAt: Date;

  @Column({ type: 'enum', enum: ReviewDecision })
  decision: ReviewDecision;

  @Column({ type: 'text', nullable: true })
  comments: string;

  @Column({ name: 'signature_verified', default: false })
  signatureVerified: boolean;

  @Column({ name: 'signature_hash', length: 255, nullable: true })
  signatureHash: string;

  @Column({ name: 'signing_key_id', length: 255, nullable: true })
  signingKeyId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}