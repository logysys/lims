import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('coa_templates')
export class CoaTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 50 })
  type: string;

  @Column({ name: 'product_type', length: 100, nullable: true })
  productType: string;

  @Column({ name: 'template_html', type: 'text' })
  templateHtml: string;

  @Column({ name: 'template_css', type: 'text', nullable: true })
  templateCss: string;

  @Column({ name: 'brand_color', length: 7, nullable: true })
  brandColor: string;

  @Column({ name: 'logo_url', length: 500, nullable: true })
  logoUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  sections: any[];

  @Column({ name: 'custom_fields', type: 'jsonb', nullable: true })
  customFields: any[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}