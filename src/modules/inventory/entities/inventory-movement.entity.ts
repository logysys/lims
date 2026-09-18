import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('inventory_movements')
export class InventoryMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'inventory_item_id', type: 'uuid' })
  inventoryItemId: string;

  @Column({ name: 'movement_type', length: 50 })
  movementType: string;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  quantity: number;

  @Column({ name: 'from_location_id', type: 'uuid', nullable: true })
  fromLocationId: string;

  @Column({ name: 'to_location_id', type: 'uuid', nullable: true })
  toLocationId: string;

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId: string;

  @Column({ name: 'reference_type', length: 50, nullable: true })
  referenceType: string;

  @Column({ name: 'performed_by', type: 'uuid', nullable: true })
  performedBy: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}