import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('coa_records')
export class CoaRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'coa_number', length: 50, unique: true })
  coaNumber: string;

  @Column({ name: 'sample_id', type: 'uuid' })
  sampleId: string;

  @Column({ name: 'batch_id', type: 'uuid' })
  batchId: string;

  @Column({ name: 'template_id', type: 'uuid', nullable: true })
  templateId: string;

  @Column({ type: 'jsonb' })
  content: Record<string, any>;

  @Column({ name: 'coa_hash', length: 255, unique: true })
  coaHash: string;

  @Column({ name: 'previous_coa_hash', length: 255, nullable: true })
  previousCoaHash: string;

  @Column({ name: 'chain_position', type: 'int', nullable: true })
  chainPosition: number;

  @Column({ name: 'qr_code_url', length: 500, nullable: true })
  qrCodeUrl: string;

  @Column({ name: 'qr_code_hash', length: 255, nullable: true })
  qrCodeHash: string;

  @Column({ name: 'public_url', length: 500, nullable: true })
  publicUrl: string;

  @Column({ name: 'analyst_signature_id', type: 'uuid', nullable: true })
  analystSignatureId: string;

  @Column({ name: 'qa_signature_id', type: 'uuid', nullable: true })
  qaSignatureId: string;

  @Column({ name: 'released_at', type: 'timestamp', nullable: true })
  releasedAt: Date;

  @Column({ name: 'expires_at', type: 'date', nullable: true })
  expiresAt: Date;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ name: 'superseded_by', type: 'uuid', nullable: true })
  supersededBy: string;

  @Column({ name: 'supersedes', type: 'uuid', nullable: true })
  supersedes: string;

  @Column({ name: 'worm_locked', default: false })
  wormLocked: boolean;

  @Column({ name: 'worm_lock_date', type: 'timestamp', nullable: true })
  wormLockDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}