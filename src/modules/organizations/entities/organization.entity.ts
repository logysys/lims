import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { OrgType, SubscriptionTier } from '@common/enums';
import { User } from '@modules/users/entities/user.entity';
import { SampleBatch } from '@modules/samples/entities/sample-batch.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'enum', enum: OrgType })
  type: OrgType;

  @Column({ name: 'org_code', length: 50, unique: true, nullable: true })
  orgCode: string;

  @Column({ name: 'parent_org_id', type: 'uuid', nullable: true })
  parentOrgId: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ length: 50, nullable: true })
  phone: string;

  @Column({ name: 'address_line1', length: 255, nullable: true })
  addressLine1: string;

  @Column({ name: 'address_line2', length: 255, nullable: true })
  addressLine2: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ length: 50, nullable: true })
  state: string;

  @Column({ length: 50, nullable: true })
  country: string;

  @Column({ name: 'postal_code', length: 20, nullable: true })
  postalCode: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'verification_date', type: 'timestamp', nullable: true })
  verificationDate: Date;

  @Column({
    name: 'subscription_tier',
    type: 'enum',
    enum: SubscriptionTier,
    default: SubscriptionTier.STARTER,
  })
  subscriptionTier: SubscriptionTier;

  @OneToMany(() => User, (user) => user.organization)
  users: User[];

  @OneToMany(() => SampleBatch, (batch) => batch.customer)
  sampleBatches: SampleBatch[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}