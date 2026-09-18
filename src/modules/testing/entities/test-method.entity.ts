import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('test_methods')
export class TestMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'method_code', length: 50, unique: true })
  methodCode: string;

  @Column({ name: 'method_name', length: 255 })
  methodName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 100, nullable: true })
  category: string;

  @Column({ name: 'instrument_type', length: 100, nullable: true })
  instrumentType: string;

  @Column({ length: 20, nullable: true })
  version: string;

  @Column({ name: 'is_current', default: true })
  isCurrent: boolean;

  @Column({ name: 'supersedes_id', type: 'uuid', nullable: true })
  supersedesId: string;

  @Column({ type: 'jsonb', nullable: true })
  parameters: Record<string, any>;

  @Column({ name: 'acceptance_criteria', type: 'jsonb', nullable: true })
  acceptanceCriteria: Record<string, any>;

  @Column({ name: 'iso_17025_standard', length: 50, nullable: true })
  iso17025Standard: string;

  @Column({ name: 'validation_status', length: 50, nullable: true })
  validationStatus: string;

  @Column({ name: 'validated_by', type: 'uuid', nullable: true })
  validatedBy: string;

  @Column({ name: 'validation_date', type: 'timestamp', nullable: true })
  validationDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}