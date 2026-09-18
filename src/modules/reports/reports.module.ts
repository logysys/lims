import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sample } from '@modules/samples/entities/sample.entity';
import { SampleTest } from '@modules/testing/entities/sample-test.entity';
import { CoaRecord } from '@modules/coa/entities/coa-record.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Sample, SampleTest, CoaRecord])],
  providers: [ReportsService],
  controllers: [ReportsController],
  exports: [ReportsService],
})
export class ReportsModule {}