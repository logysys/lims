import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SampleBatch } from '@modules/samples/entities/sample-batch.entity';
import { Sample } from '@modules/samples/entities/sample.entity';
import { SampleTest } from '@modules/testing/entities/sample-test.entity';
import { Product } from '@modules/products/entities/product.entity';
import { TestMethod } from '@modules/testing/entities/test-method.entity';

import { BulkSubmissionService } from './bulk-submission.service';
import { BulkSubmissionController } from './bulk-submission.controller';
import { AuditModule } from '@modules/audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SampleBatch,
      Sample,
      SampleTest,
      Product,
      TestMethod,   // ← REQUIRED: injected in BulkSubmissionService
    ]),
    AuditModule,
  ],
  providers: [BulkSubmissionService],
  controllers: [BulkSubmissionController],
  exports: [BulkSubmissionService],
})
export class BulkSubmissionModule {}