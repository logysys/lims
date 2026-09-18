import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowState } from './entities/workflow-state.entity';
import { WorkflowTransition } from './entities/workflow-transition.entity';
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';
import { AuditModule } from '@modules/audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkflowState, WorkflowTransition]),
    forwardRef(() => AuditModule),
  ],
  providers: [WorkflowService],
  controllers: [WorkflowController],
  exports: [WorkflowService],
})
export class WorkflowModule {}