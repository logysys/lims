import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InstrumentType, InstrumentStatus } from '@common/enums';

@Entity('instruments')
export class Instrument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'instrument_code', length: 50, unique: true })
  instrumentCode: string;

  @Column({ type: 'enum', enum: InstrumentType })
  type: InstrumentType;

  @Column({ length: 100, nullable: true })
  model: string;

  @Column({ length: 100, nullable: true })
  manufacturer: string;

  @Column({ name: 'serial_number', length: 100, nullable: true })
  serialNumber: string;

  @Column({ type: 'enum', enum: InstrumentStatus, default: InstrumentStatus.OPERATIONAL })
  status: InstrumentStatus;

  @Column({ name: 'lab_location', length: 100, nullable: true })
  labLocation: string;

  @Column({ length: 50, nullable: true })
  room: string;

  @Column({ name: 'bench_number', length: 20, nullable: true })
  benchNumber: string;

  @Column({ name: 'last_calibration_date', type: 'date', nullable: true })
  lastCalibrationDate: Date;

  @Column({ name: 'next_calibration_date', type: 'date', nullable: true })
  nextCalibrationDate: Date;

  @Column({ name: 'calibration_certificate_url', length: 500, nullable: true })
  calibrationCertificateUrl: string;

  @Column({ name: 'maintenance_schedule', type: 'jsonb', nullable: true })
  maintenanceSchedule: Record<string, any>;

  @Column({ name: 'last_maintenance_date', type: 'date', nullable: true })
  lastMaintenanceDate: Date;

  @Column({ name: 'next_maintenance_date', type: 'date', nullable: true })
  nextMaintenanceDate: Date;

  @Column({ name: 'software_version', length: 50, nullable: true })
  softwareVersion: string;

  @Column({ name: 'integration_config', type: 'jsonb', nullable: true })
  integrationConfig: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}