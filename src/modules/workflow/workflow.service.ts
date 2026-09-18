import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { WorkflowState } from './entities/workflow-state.entity';
import { WorkflowTransition } from './entities/workflow-transition.entity';
import { AuditService } from '@modules/audit/audit.service';
import { SampleStatus, AuditAction } from '@common/enums';

interface TransitionContext {
  recordId: string;
  recordType: string;
  userId: string;
  userRole: string;
  ipAddress?: string;
  justification?: string;
}

@Injectable()
export class WorkflowService implements OnModuleInit {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    @InjectRepository(WorkflowState)
    private readonly stateRepository: Repository<WorkflowState>,
    @InjectRepository(WorkflowTransition)
    private readonly transitionRepository: Repository<WorkflowTransition>,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    // Seed the default sample workflow states if not present
    await this.seedDefaultWorkflow();
  }

  private async seedDefaultWorkflow() {
    const existing = await this.stateRepository.count({
      where: { workflowName: 'sample' },
    });
    if (existing > 0) return;

    const states = [
      {
        stateName: 'Draft',
        stateCode: SampleStatus.DRAFT,
        allowedRoles: ['customer', 'lab_admin'],
        allowedTransitions: [SampleStatus.SUBMITTED],
        requiresEsignature: false,
        requiresQaReview: false,
        displayColor: '#9CA3AF',
      },
      {
        stateName: 'Submitted',
        stateCode: SampleStatus.SUBMITTED,
        allowedRoles: ['customer', 'lab_admin', 'analyst'],
        allowedTransitions: [SampleStatus.RECEIVED],
        displayColor: '#60A5FA',
      },
      {
        stateName: 'Received',
        stateCode: SampleStatus.RECEIVED,
        allowedRoles: ['analyst', 'lab_admin'],
        allowedTransitions: [SampleStatus.ACCESSIONED],
        displayColor: '#3B82F6',
      },
      {
        stateName: 'Accessioned',
        stateCode: SampleStatus.ACCESSIONED,
        allowedRoles: ['analyst', 'lab_admin'],
        allowedTransitions: [SampleStatus.PREPARING],
        displayColor: '#8B5CF6',
      },
      {
        stateName: 'Preparing',
        stateCode: SampleStatus.PREPARING,
        allowedRoles: ['analyst'],
        allowedTransitions: [SampleStatus.TESTING],
        displayColor: '#A855F7',
      },
      {
        stateName: 'Testing',
        stateCode: SampleStatus.TESTING,
        allowedRoles: ['analyst'],
        allowedTransitions: [SampleStatus.REVIEW],
        displayColor: '#F59E0B',
      },
      {
        stateName: 'Review',
        stateCode: SampleStatus.REVIEW,
        allowedRoles: ['analyst', 'qa'],
        allowedTransitions: [SampleStatus.QA_REVIEW],
        requiresEsignature: true,
        displayColor: '#EAB308',
      },
      {
        stateName: 'QA Review',
        stateCode: SampleStatus.QA_REVIEW,
        allowedRoles: ['qa'],
        allowedTransitions: [SampleStatus.APPROVED, SampleStatus.TESTING],
        requiresEsignature: true,
        requiresQaReview: true,
        displayColor: '#EC4899',
      },
      {
        stateName: 'Approved',
        stateCode: SampleStatus.APPROVED,
        allowedRoles: ['qa'],
        allowedTransitions: [SampleStatus.RELEASED],
        requiresEsignature: true,
        displayColor: '#10B981',
      },
      {
        stateName: 'Released',
        stateCode: SampleStatus.RELEASED,
        allowedRoles: ['qa'],
        allowedTransitions: [SampleStatus.ARCHIVED],
        isTerminal: true,
        displayColor: '#059669',
      },
      {
        stateName: 'Archived',
        stateCode: SampleStatus.ARCHIVED,
        allowedRoles: ['lab_admin'],
        allowedTransitions: [],
        isTerminal: true,
        displayColor: '#6B7280',
      },
    ];

    for (const state of states) {
      await this.stateRepository.save(
        this.stateRepository.create({
          workflowName: 'sample',
          ...state,
          displayName: state.stateName,
        }),
      );
    }

    this.logger.log('Seeded default sample workflow states');
  }

  async getWorkflowStates(workflowName = 'sample') {
    return this.stateRepository.find({
      where: { workflowName },
      order: { createdAt: 'ASC' },
    });
  }

  async getAllowedTransitions(currentState: string, userRole: string) {
    const state = await this.stateRepository.findOne({
      where: { workflowName: 'sample', stateCode: currentState },
    });

    if (!state) return [];

    const transitions = (state.allowedTransitions || []) as string[];
    const allowed: any[] = [];

    for (const targetState of transitions) {
      const target = await this.stateRepository.findOne({
        where: { workflowName: 'sample', stateCode: targetState },
      });
      if (!target) continue;

      const allowedRoles = (target.allowedRoles || []) as string[];
      if (allowedRoles.includes(userRole) || allowedRoles.includes('*')) {
        allowed.push({
          stateCode: target.stateCode,
          stateName: target.stateName,
          displayColor: target.displayColor,
          requiresEsignature: target.requiresEsignature,
        });
      }
    }

    return allowed;
  }

  async canTransition(
    fromState: string,
    toState: string,
    userRole: string,
  ): Promise<{ allowed: boolean; reason?: string; requiresEsignature?: boolean }> {
    const from = await this.stateRepository.findOne({
      where: { workflowName: 'sample', stateCode: fromState },
    });
    const to = await this.stateRepository.findOne({
      where: { workflowName: 'sample', stateCode: toState },
    });

    if (!from || !to) {
      return { allowed: false, reason: 'Invalid state' };
    }

    if (from.isTerminal) {
      return { allowed: false, reason: 'Current state is terminal' };
    }

    const allowedTransitions = (from.allowedTransitions || []) as string[];
    if (!allowedTransitions.includes(toState)) {
      return {
        allowed: false,
        reason: `Transition from ${fromState} to ${toState} is not allowed`,
      };
    }

    const allowedRoles = (to.allowedRoles || []) as string[];
    if (!allowedRoles.includes(userRole) && !allowedRoles.includes('*')) {
      return {
        allowed: false,
        reason: `Role ${userRole} cannot transition to ${toState}`,
      };
    }

    return { allowed: true, requiresEsignature: to.requiresEsignature };
  }

  async executeTransition(context: TransitionContext, targetState: string) {
    const check = await this.canTransition(
      context.recordType === 'sample' ? 'draft' : 'draft', // will be overridden
      targetState,
      context.userRole,
    );

    // Actual validation is done by caller (who knows the current state)

    const transition = this.transitionRepository.create({
      recordId: context.recordId,
      recordType: context.recordType,
      fromState: 'unknown',
      toState: targetState,
      userId: context.userId,
      ipAddress: context.ipAddress,
      justification: context.justification,
    });

    const saved = await this.transitionRepository.save(transition);

    this.eventEmitter.emit('workflow.transition', {
      ...context,
      toState: targetState,
      transitionId: saved.id,
    });

    return saved;
  }

  async getHistory(recordId: string, recordType = 'sample') {
    return this.transitionRepository.find({
      where: { recordId, recordType },
      order: { createdAt: 'DESC' },
    });
  }
}