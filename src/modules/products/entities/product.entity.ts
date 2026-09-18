import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from '@modules/organizations/entities/organization.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 100, nullable: true })
  sku: string;

  @Column({ length: 50, nullable: true })
  upc: string;

  @Column({ name: 'product_code', length: 100, unique: true, nullable: true })
  productCode: string;

  @Column({ name: 'manufacturer_id', type: 'uuid' })
  manufacturerId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'manufacturer_id' })
  manufacturer: Organization;

  @Column({ length: 100, nullable: true })
  category: string;

  @Column({ name: 'sub_category', length: 100, nullable: true })
  subCategory: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  ingredients: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  specifications: Record<string, any>;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'requires_certification', default: true })
  requiresCertification: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}