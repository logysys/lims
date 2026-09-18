import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('inventory_items')
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'item_code', length: 50, unique: true })
  itemCode: string;

  @Column({ name: 'item_type', length: 50 })
  itemType: string;

  @Column({ length: 100, nullable: true })
  category: string;

  @Column({ name: 'sub_category', length: 100, nullable: true })
  subCategory: string;

  @Column({ length: 255, nullable: true })
  manufacturer: string;

  @Column({ name: 'catalog_number', length: 100, nullable: true })
  catalogNumber: string;

  @Column({ name: 'lot_number', length: 100, nullable: true })
  lotNumber: string;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  quantity: number;

  @Column({ length: 20 })
  unit: string;

  @Column({ name: 'minimum_quantity', type: 'decimal', precision: 10, scale: 4, nullable: true })
  minimumQuantity: number;

  @Column({ name: 'maximum_quantity', type: 'decimal', precision: 10, scale: 4, nullable: true })
  maximumQuantity: number;

  @Column({ name: 'storage_location_id', type: 'uuid', nullable: true })
  storageLocationId: string;

  @Column({ name: 'bin_number', length: 20, nullable: true })
  binNumber: string;

  @Column({ length: 50, default: 'active' })
  status: string;

  @Column({ name: 'is_consumable', default: true })
  isConsumable: boolean;

  @Column({ name: 'is_hazardous', default: false })
  isHazardous: boolean;

  @Column({ name: 'msds_url', length: 500, nullable: true })
  msdsUrl: string;

  @Column({ name: 'certificate_url', length: 500, nullable: true })
  certificateUrl: string;

  @Column({ name: 'safety_data', type: 'text', nullable: true })
  safetyData: string;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}