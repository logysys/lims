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
import { SampleBatch } from './sample-batch.entity';
import { Product } from '@modules/products/entities/product.entity';
import { User } from '@modules/users/entities/user.entity';
import { SampleTest } from '@modules/testing/entities/sample-test.entity';

@Entity('samples')
export class Sample {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sample_code', length: 100, unique: true })
  sampleCode: string;

  @Column({ name: 'batch_id', type: 'uuid' })
  batchId: string;

  @ManyToOne(() => SampleBatch, (batch) => batch.samples, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batch_id' })
  batch: SampleBatch;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'lot_number', length: 100 })
  lotNumber: string;

  @Column({ name: 'manufacturing_date', type: 'date', nullable: true })
  manufacturingDate: Date;

  @Column({ name: 'expiration_date', type: 'date', nullable: true })
  expirationDate: Date;

  @Column({ name: 'sample_type', length: 50, nullable: true })
  sampleType: string;

  @Column({ name: 'sample_weight', type: 'decimal', precision: 10, scale: 4, nullable: true })
  sampleWeight: number;

  @Column({ name: 'sample_volume', type: 'decimal', precision: 10, scale: 4, nullable: true })
  sampleVolume: number;

  @Column({ length: 20, nullable: true })
  unit: string;

  @Column({ name: 'storage_condition', length: 100, nullable: true })
  storageCondition: string;

  @Column({ length: 50, default: 'pending' })
  status: string;

  @Column({ name: 'current_location', length: 100, nullable: true })
  currentLocation: string;

  @Column({ name: 'container_id', length: 100, nullable: true })
  containerId: string;

  @Column({ name: 'collected_by', length: 100, nullable: true })
  collectedBy: string;

  @Column({ name: 'collected_date', type: 'date', nullable: true })
  collectedDate: Date;

  @Column({ name: 'received_by', type: 'uuid', nullable: true })
  receivedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'received_by' })
  receiver: User;

  @Column({ name: 'received_date', type: 'timestamp', nullable: true })
  receivedDate: Date;

  @Column({ name: 'result_summary', type: 'text', nullable: true })
  resultSummary: string;

  @Column({ name: 'is_out_of_spec', default: false })
  isOutOfSpec: boolean;

  @Column({ name: 'is_retest', default: false })
  isRetest: boolean;

  @Column({ name: 'coa_generated', default: false })
  coaGenerated: boolean;

  @Column({ name: 'coa_url', length: 500, nullable: true })
  coaUrl: string;

  @Column({ name: 'qr_code_url', length: 500, nullable: true })
  qrCodeUrl: string;

  @Column({ name: 'qr_code_hash', length: 255, nullable: true })
  qrCodeHash: string;

  @OneToMany(() => SampleTest, (test) => test.sample)
  tests: SampleTest[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}