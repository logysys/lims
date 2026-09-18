import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('workflow_states')
export class WorkflowState {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workflow_name', length: 100 })
  workflowName: string;

  @Column({ name: 'state_name', length: 50 })
  stateName: string;

  @Column({ name: 'state_code', length: 50 })
  stateCode: string;

  @Column({ name: 'allowed_roles', type: 'jsonb', nullable: true })
  allowedRoles: string[];

  @Column({ name: 'allowed_transitions', type: 'jsonb', nullable: true })
  allowedTransitions: string[];

  @Column({ name: 'is_terminal', default: false })
  isTerminal: boolean;

  @Column({ name: 'requires_esignature', default: false })
  requiresEsignature: boolean;

  @Column({ name: 'requires_qa_review', default: false })
  requiresQaReview: boolean;

  @Column({ name: 'display_name', length: 100, nullable: true })
  displayName: string;

  @Column({ name: 'display_color', length: 20, nullable: true })
  displayColor: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}