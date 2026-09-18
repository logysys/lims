import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Sample } from '@modules/samples/entities/sample.entity';
import { TestMethod } from './test-method.entity';
import { User } from '@modules/users/entities/user.entity';

@Entity('sample_tests')
export class SampleTest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sample_id', type: 'uuid' })
  sampleId: string;

  @ManyToOne(() => Sample, (sample) => sample.tests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sample_id' })
  sample: Sample;

  @Column({ name: 'method_id', type: 'uuid' })
  methodId: string;

  @ManyToOne(() => TestMethod)
  @JoinColumn({ name: 'method_id' })
  method: TestMethod;

  @Column({ length: 50, default: 'pending' })
  status: string;

  @Column({ name: 'instrument_id', type: 'uuid', nullable: true })
  instrumentId?: string;

  @Column({ name: 'instrument_method_id', type: 'uuid', nullable: true })
  instrumentMethodId?: string;

  @Column({
    name: 'result_value',
    type: 'decimal',
    precision: 20,
    scale: 6,
    nullable: true,
  })
  resultValue?: number;

  @Column({ name: 'result_unit', length: 50, nullable: true })
  resultUnit?: string;

  @Column({ name: 'result_text', type: 'text', nullable: true })
  resultText?: string;

  @Column({ name: 'result_status', length: 50, nullable: true })
  resultStatus?: string;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewed_by' })
  reviewer?: User;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt?: Date;

  @Column({ name: 'test_order', type: 'int', nullable: true })
  testOrder?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}