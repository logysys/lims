import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('workflow_transitions')
export class WorkflowTransition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'record_id', type: 'uuid' })
  recordId: string;

  @Column({ name: 'record_type', length: 50 })
  recordType: string;

  @Column({ name: 'from_state', length: 50 })
  fromState: string;

  @Column({ name: 'to_state', length: 50 })
  toState: string;

  @Column({ name: 'transition_name', length: 100, nullable: true })
  transitionName: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  justification: string;

  @Column({ name: 'audit_event_id', type: 'bigint', nullable: true })
  auditEventId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}