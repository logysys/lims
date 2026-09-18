import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('storage_locations')
export class StorageLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'location_code', length: 50, unique: true })
  locationCode: string;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'location_type', length: 50 })
  locationType: string;

  @Column({ name: 'temperature_range', length: 50, nullable: true })
  temperatureRange: string;

  @Column({ length: 50, nullable: true })
  capacity: string;

  @Column({ name: 'parent_location_id', type: 'uuid', nullable: true })
  parentLocationId: string;

  @Column({ length: 20, nullable: true })
  shelf: string;

  @Column({ length: 20, nullable: true })
  rack: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_occupied', default: false })
  isOccupied: boolean;

  @Column({ name: 'current_usage_percent', type: 'decimal', precision: 5, scale: 2, nullable: true })
  currentUsagePercent: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}