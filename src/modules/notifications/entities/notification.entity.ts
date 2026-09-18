import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ length: 50 })
  type: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ name: 'action_url', length: 500, nullable: true })
  actionUrl: string;

  @Column({ name: 'action_text', length: 100, nullable: true })
  actionText: string;

  @Column({ length: 50, default: 'pending' })
  status: string;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date;

  @Column({ length: 20, default: 'normal' })
  priority: string;

  @Column({ length: 50, nullable: true })
  category: string;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @Column({ name: 'delivery_attempts', type: 'int', default: 0 })
  deliveryAttempts: number;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}