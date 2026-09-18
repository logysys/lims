import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SampleTest } from './entities/sample-test.entity';
import { TestMethod } from './entities/test-method.entity';
import { TestingService } from './testing.service';
import { TestingController } from './testing.controller';
import { AuditModule } from '@modules/audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SampleTest, TestMethod]),
    forwardRef(() => AuditModule),
  ],
  providers: [TestingService],
  controllers: [TestingController],
  exports: [TestingService],
})
export class TestingModule {}