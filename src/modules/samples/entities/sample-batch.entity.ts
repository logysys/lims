import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SampleStatus, PriorityLevel } from '@common/enums';
import { Organization } from '@modules/organizations/entities/organization.entity';
import { User } from '@modules/users/entities/user.entity';
import { Sample } from './sample.entity';

@Entity('sample_batches')
export class SampleBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'batch_number', length: 50, unique: true })
  batchNumber: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'customer_id' })
  customer: Organization;

  @Column({ name: 'purchase_order', length: 100, nullable: true })
  purchaseOrder: string;

  @Column({
    type: 'enum',
    enum: SampleStatus,
    default: SampleStatus.DRAFT,
  })
  status: SampleStatus;

  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ name: 'received_at', type: 'timestamp', nullable: true })
  receivedAt: Date;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({ name: 'qa_reviewer_id', type: 'uuid', nullable: true })
  qaReviewerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'qa_reviewer_id' })
  qaReviewer: User;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({
    type: 'enum',
    enum: PriorityLevel,
    default: PriorityLevel.MEDIUM,
  })
  priority: PriorityLevel;

  @Column({ name: 'is_urgent', default: false })
  isUrgent: boolean;

  @OneToMany(() => Sample, (sample) => sample.batch)
  samples: Sample[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}