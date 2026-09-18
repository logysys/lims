import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('audit_trail')
export class AuditTrail {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'event_id', type: 'uuid', default: () => 'gen_random_uuid()' })
  eventId: string;

  @Column({ name: 'request_id', length: 100, nullable: true })
  requestId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @Column({ name: 'user_email', length: 255, nullable: true })
  userEmail: string;

  @Column({ length: 100 })
  action: string;

  @Column({ name: 'resource_type', length: 50 })
  resourceType: string;

  @Column({ name: 'resource_id', type: 'uuid' })
  resourceId: string;

  @Column({ name: 'old_values', type: 'jsonb', nullable: true })
  oldValues: Record<string, any>;

  @Column({ name: 'new_values', type: 'jsonb', nullable: true })
  newValues: Record<string, any>;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ name: 'previous_hash', length: 255, nullable: true })
  previousHash: string;

  @Column({ name: 'event_hash', length: 255, unique: true })
  eventHash: string;

  @Column({ name: 'was_signed', default: false })
  wasSigned: boolean;

  @Column({ name: 'signature_id', type: 'uuid', nullable: true })
  signatureId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}