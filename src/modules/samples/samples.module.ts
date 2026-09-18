import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sample } from './entities/sample.entity';
import { SampleBatch } from './entities/sample-batch.entity';
import { SampleTest } from '@modules/testing/entities/sample-test.entity';
import { SamplesService } from './samples.service';
import { SamplesController } from './samples.controller';
import { AuditModule } from '@modules/audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sample, SampleBatch, SampleTest]),
    forwardRef(() => AuditModule),
  ],
  providers: [SamplesService],
  controllers: [SamplesController],
  exports: [SamplesService],
})
export class SamplesModule {}