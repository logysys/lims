import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { WorkflowService } from './workflow.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('Workflow')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get('states')
  async getStates(@Query('workflow') workflow?: string) {
    return this.workflowService.getWorkflowStates(workflow);
  }

  @Get('transitions/:currentState')
  async getTransitions(
    @Param('currentState') currentState: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.workflowService.getAllowedTransitions(currentState, userRole);
  }

  @Get('history/:recordId')
  async getHistory(
    @Param('recordId') recordId: string,
    @Query('type') type?: string,
  ) {
    return this.workflowService.getHistory(recordId, type || 'sample');
  }
}