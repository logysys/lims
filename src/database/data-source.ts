import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

// Explicit entity imports — required because ts-node + CLI cannot resolve globs reliably
import { Organization } from '../modules/organizations/entities/organization.entity';
import { User } from '../modules/users/entities/user.entity';
import { UserSession } from '../modules/users/entities/user-session.entity';
import { Product } from '../modules/products/entities/product.entity';
import { TestMethod } from '../modules/testing/entities/test-method.entity';
import { SampleBatch } from '../modules/samples/entities/sample-batch.entity';
import { Sample } from '../modules/samples/entities/sample.entity';
import { SampleTest } from '../modules/testing/entities/sample-test.entity';
import { Instrument } from '../modules/instruments/entities/instrument.entity';
import { QualityReview } from '../modules/quality/entities/quality-review.entity';
import { ElectronicSignature } from '../modules/quality/entities/electronic-signature.entity';
import { AuditTrail } from '../modules/audit/entities/audit-trail.entity';
import { CoaTemplate } from '../modules/coa/entities/coa-template.entity';
import { CoaRecord } from '../modules/coa/entities/coa-record.entity';
import { VerificationRecord } from '../modules/verification/entities/verification-record.entity';
import { StorageLocation } from '../modules/inventory/entities/storage-location.entity';
import { InventoryItem } from '../modules/inventory/entities/inventory-item.entity';
import { InventoryMovement } from '../modules/inventory/entities/inventory-movement.entity';
import { Invoice } from '../modules/billing/entities/invoice.entity';
import { Notification } from '../modules/notifications/entities/notification.entity';
import { SecureMessage } from '../modules/messages/entities/secure-message.entity';
import { WorkflowState } from '../modules/workflow/entities/workflow-state.entity';
import { WorkflowTransition } from '../modules/workflow/entities/workflow-transition.entity';
import { ApiKey } from '../modules/api-keys/entities/api-key.entity';
import { VerifiedBadge } from '../modules/badges/entities/verified-badge.entity';

// Migration imports
import { InitialSchema1700000000000 } from './migrations/1700000000000-InitialSchema';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgrestrusource',
  password: process.env.DB_PASSWORD || 'postgrestrusource',
  database: process.env.DB_DATABASE || 'trusource_postgres',
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true' ? ['query', 'error'] : ['error'],
  entities: [
    Organization,
    User,
    UserSession,
    Product,
    TestMethod,
    SampleBatch,
    Sample,
    SampleTest,
    Instrument,
    QualityReview,
    ElectronicSignature,
    AuditTrail,
    CoaTemplate,
    CoaRecord,
    VerificationRecord,
    StorageLocation,
    InventoryItem,
    InventoryMovement,
    Invoice,
    Notification,
    SecureMessage,
    WorkflowState,
    WorkflowTransition,
    ApiKey,
    VerifiedBadge,
  ],
  migrations: [InitialSchema1700000000000],
  subscribers: [],
  migrationsTableName: 'typeorm_migrations',
});