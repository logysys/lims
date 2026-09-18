import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'api_key', length: 255, unique: true })
  apiKey: string;

  @Column({ name: 'hashed_key', length: 255 })
  hashedKey: string;

  @Column({ type: 'jsonb' })
  scopes: string[];

  @Column({ name: 'rate_limit_per_minute', type: 'int', default: 60 })
  rateLimitPerMinute: number;

  @Column({ name: 'rate_limit_per_hour', type: 'int', default: 1000 })
  rateLimitPerHour: number;

  @Column({ length: 50, default: 'active' })
  status: string;

  @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ name: 'ip_whitelist', type: 'text', array: true, nullable: true })
  ipWhitelist: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}