import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('verified_badges')
export class VerifiedBadge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ name: 'verification_record_id', type: 'uuid', nullable: true })
  verificationRecordId: string;

  @Column({ name: 'badge_code', length: 50, unique: true })
  badgeCode: string;

  @Column({ name: 'badge_url', length: 500, nullable: true })
  badgeUrl: string;

  @Column({ name: 'badge_embed_code', type: 'text', nullable: true })
  badgeEmbedCode: string;

  @Column({ length: 50, default: 'active' })
  status: string;

  @Column({ name: 'valid_from', type: 'date' })
  validFrom: Date;

  @Column({ name: 'valid_until', type: 'date', nullable: true })
  validUntil: Date;

  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @Column({ name: 'click_count', default: 0 })
  clickCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}