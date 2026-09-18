import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole } from '@common/enums';
import { Organization } from '@modules/organizations/entities/organization.entity';
import { UserSession } from './user-session.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  @Exclude()
  passwordHash: string;

  @Column({ name: 'first_name', length: 100, nullable: true })
  firstName: string;

  @Column({ name: 'last_name', length: 100, nullable: true })
  lastName: string;

  @Column({ length: 50, nullable: true })
  phone: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ name: 'org_id', type: 'uuid', nullable: true })
  orgId: string;

  @ManyToOne(() => Organization, (org) => org.users)
  @JoinColumn({ name: 'org_id' })
  organization: Organization;

  @Column({ name: 'mfa_enabled', default: false })
  mfaEnabled: boolean;

  @Column({ name: 'mfa_secret', length: 255, nullable: true })
  @Exclude()
  mfaSecret: string;

  @Column({ name: 'last_login', type: 'timestamp', nullable: true })
  lastLogin: Date;

  @Column({ name: 'login_failures', default: 0 })
  loginFailures: number;

  @Column({ name: 'account_locked', default: false })
  accountLocked: boolean;

  @Column({ name: 'locked_until', type: 'timestamp', nullable: true })
  lockedUntil: Date;

  @Column({ length: 100, nullable: true })
  title: string;

  @Column({ length: 100, nullable: true })
  department: string;

  @Column({ name: 'profile_image_url', length: 500, nullable: true })
  profileImageUrl: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'verification_token', length: 255, nullable: true })
  @Exclude()
  verificationToken: string;

  @Column({ name: 'reset_token', length: 255, nullable: true })
  @Exclude()
  resetToken: string;

  @Column({ name: 'reset_token_expiry', type: 'timestamp', nullable: true })
  @Exclude()
  resetTokenExpiry: Date;

  @Column({ name: 'approval_status', length: 50, default: 'approved' })
  approvalStatus: string;

  @OneToMany(() => UserSession, (session) => session.user)
  sessions: UserSession[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}