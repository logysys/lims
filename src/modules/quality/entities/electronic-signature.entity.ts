import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '@modules/users/entities/user.entity';

@Entity('electronic_signatures')
export class ElectronicSignature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'record_id', type: 'uuid' })
  recordId: string;

  @Column({ name: 'record_type', length: 50 })
  recordType: string;

  @Column({ name: 'sign_meaning', length: 255 })
  signMeaning: string;

  @Column({ name: 'signed_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  signedAt: Date;

  @Column({ name: 'signature_hash', length: 255, unique: true })
  signatureHash: string;

  @Column({ name: 'step_up_verified', default: true })
  stepUpVerified: boolean;

  @Column({ name: 'step_up_method', length: 50, nullable: true })
  stepUpMethod: string;

  @Column({ name: 'step_up_timestamp', type: 'timestamp', nullable: true })
  stepUpTimestamp: Date;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ length: 255, nullable: true })
  location: string;

  @Column({ name: 'bound_record_hash', length: 255 })
  boundRecordHash: string;

  @Column({ name: 'record_version', type: 'int', nullable: true })
  recordVersion: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}