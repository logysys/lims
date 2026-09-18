import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QualityReview } from './entities/quality-review.entity';
import { ElectronicSignature } from './entities/electronic-signature.entity';
import { Sample } from '@modules/samples/entities/sample.entity';
import { QualityService } from './quality.service';
import { QualityController } from './quality.controller';
import { AuditModule } from '@modules/audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([QualityReview, ElectronicSignature, Sample]),
    forwardRef(() => AuditModule),
  ],
  providers: [QualityService],
  controllers: [QualityController],
  exports: [QualityService],
})
export class QualityModule {}