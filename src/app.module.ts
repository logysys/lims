import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import configuration from '@config/configuration';

// Core modules
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { OrganizationsModule } from '@modules/organizations/organizations.module';
import { AuditModule } from '@modules/audit/audit.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';

// Business modules
import { ProductsModule } from '@modules/products/products.module';
import { SamplesModule } from '@modules/samples/samples.module';
import { TestingModule } from '@modules/testing/testing.module';
import { QualityModule } from '@modules/quality/quality.module';
import { CoaModule } from '@modules/coa/coa.module';
import { VerificationModule } from '@modules/verification/verification.module';
import { InventoryModule } from '@modules/inventory/inventory.module';
import { InstrumentsModule } from '@modules/instruments/instruments.module';
import { MessagesModule } from '@modules/messages/messages.module';
import { BadgesModule } from '@modules/badges/badges.module';
import { BillingModule } from '@modules/billing/billing.module';
import { ApiKeysModule } from '@modules/api-keys/api-keys.module';

// Advanced modules
import { WorkflowModule } from '@modules/workflow/workflow.module';
import { ReportsModule } from '@modules/reports/reports.module';
import { JobsModule } from '@modules/jobs/jobs.module';
import { ConsumerModule } from '@modules/consumer/consumer.module';
import { BulkSubmissionModule } from '@modules/bulk-submission/bulk-submission.module';
import { HealthModule } from '@modules/health/health.module';

// Common
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { AllExceptionsFilter } from '@common/filters/http-exception.filter';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '.env.local'],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
        logging: configService.get('database.logging'),
        autoLoadEntities: true,
      }),
    }),

    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 60000, limit: 100 },
      { name: 'long', ttl: 3600000, limit: 1000 },
    ]),

    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),

    // Core
    AuthModule,
    UsersModule,
    OrganizationsModule,
    AuditModule,
    NotificationsModule,

    // Business
    ProductsModule,
    SamplesModule,
    TestingModule,
    QualityModule,
    CoaModule,
    VerificationModule,
    InventoryModule,
    InstrumentsModule,
    MessagesModule,
    BadgesModule,
    BillingModule,
    ApiKeysModule,

    // Advanced
    WorkflowModule,
    ReportsModule,
    JobsModule,
    ConsumerModule,
    BulkSubmissionModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}