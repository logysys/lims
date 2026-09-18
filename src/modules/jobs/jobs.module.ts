import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmailProcessor } from './processors/email.processor';
import { CoaProcessor } from './processors/coa.processor';
import { ReportProcessor } from './processors/report.processor';
import { ScheduledTasksService } from './scheduled-tasks.service';

import { NotificationsModule } from '@modules/notifications/notifications.module';
import { CoaModule } from '@modules/coa/coa.module';
import { ReportsModule } from '@modules/reports/reports.module';
import { UsersModule } from '@modules/users/users.module';

import { Instrument } from '@modules/instruments/entities/instrument.entity';
import { InventoryItem } from '@modules/inventory/entities/inventory-item.entity';
import { SampleBatch } from '@modules/samples/entities/sample-batch.entity';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('redis.host') ?? 'localhost',
          port: Number(configService.get<string>('redis.port') ?? 6379),
          password: configService.get<string>('redis.password') || undefined,
        },
      }),
    }),
    BullModule.registerQueue(
      { name: 'email' },
      { name: 'coa-generation' },
      { name: 'reports' },
    ),
    TypeOrmModule.forFeature([Instrument, InventoryItem, SampleBatch]),
    NotificationsModule,
    CoaModule,
    ReportsModule,
    UsersModule,
  ],
  providers: [
    EmailProcessor,
    CoaProcessor,
    ReportProcessor,
    ScheduledTasksService,
  ],
  exports: [BullModule],
})
export class JobsModule {}