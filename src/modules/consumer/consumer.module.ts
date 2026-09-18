import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationRecord } from '@modules/verification/entities/verification-record.entity';
import { VerifiedBadge } from '@modules/badges/entities/verified-badge.entity';
import { Product } from '@modules/products/entities/product.entity';
import { ConsumerService } from './consumer.service';
import { ConsumerController } from './consumer.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VerificationRecord, VerifiedBadge, Product])],
  providers: [ConsumerService],
  controllers: [ConsumerController],
  exports: [ConsumerService],
})
export class ConsumerModule {}