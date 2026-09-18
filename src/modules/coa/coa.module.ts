import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoaRecord } from './entities/coa-record.entity';
import { CoaTemplate } from './entities/coa-template.entity';
import { VerificationRecord } from '@modules/verification/entities/verification-record.entity';
import { Sample } from '@modules/samples/entities/sample.entity';
import { SampleBatch } from '@modules/samples/entities/sample-batch.entity';
import { CoaService } from './coa.service';
import { CoaController } from './coa.controller';
import { AuditModule } from '@modules/audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CoaRecord,
      CoaTemplate,
      VerificationRecord,
      Sample,
      SampleBatch,
    ]),
    forwardRef(() => AuditModule),
  ],
  providers: [CoaService],
  controllers: [CoaController],
  exports: [CoaService],
})
export class CoaModule {}