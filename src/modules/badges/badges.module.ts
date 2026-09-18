import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerifiedBadge } from './entities/verified-badge.entity';
import { BadgesService } from './badges.service';
import { BadgesController } from './badges.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VerifiedBadge])],
  providers: [BadgesService],
  controllers: [BadgesController],
  exports: [BadgesService],
})
export class BadgesModule {}