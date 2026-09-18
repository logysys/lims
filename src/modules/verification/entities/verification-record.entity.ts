import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('verification_records')
export class VerificationRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'coa_id', type: 'uuid' })
  coaId: string;

  @Column({ name: 'product_name', length: 255 })
  productName: string;

  @Column({ name: 'manufacturer_name', length: 255 })
  manufacturerName: string;

  @Column({ name: 'manufacturer_id', type: 'uuid', nullable: true })
  manufacturerId: string;

  @Column({ name: 'lot_number', length: 100 })
  lotNumber: string;

  @Column({ type: 'text', array: true, nullable: true })
  compoundNames: string[];

  @Column({ name: 'test_results', type: 'jsonb', nullable: true })
  testResults: Record<string, any>;

  @Column({ name: 'verification_status', length: 50, default: 'verified' })
  verificationStatus: string;

  @Column({ name: 'last_verified_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastVerifiedAt: Date;

  @Column({ name: 'public_url', length: 500 })
  publicUrl: string;

  @Column({ name: 'qr_code_url', length: 500, nullable: true })
  qrCodeUrl: string;

  @Column({ name: 'qr_code_data', type: 'text', nullable: true })
  qrCodeData: string;

  @Column({ name: 'badge_asset_url', length: 500, nullable: true })
  badgeAssetUrl: string;

  @Column({ name: 'badge_hash', length: 255, nullable: true })
  badgeHash: string;

  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @Column({ name: 'scan_count', default: 0 })
  scanCount: number;

  @Column({ name: 'download_count', default: 0 })
  downloadCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}