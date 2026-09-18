import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('secure_messages')
export class SecureMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sender_id', type: 'uuid' })
  senderId: string;

  @Column({ name: 'recipient_id', type: 'uuid' })
  recipientId: string;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId: string;

  @Column({ name: 'sample_id', type: 'uuid', nullable: true })
  sampleId: string;

  @Column({ length: 255 })
  subject: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ length: 50, default: 'unread' })
  status: string;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date;

  @Column({ name: 'replied_at', type: 'timestamp', nullable: true })
  repliedAt: Date;

  @Column({ name: 'parent_message_id', type: 'uuid', nullable: true })
  parentMessageId: string;

  @Column({ type: 'jsonb', nullable: true })
  attachments: Record<string, any>[];

  @Column({ name: 'is_encrypted', default: true })
  isEncrypted: boolean;

  @Column({ name: 'encryption_key_id', length: 255, nullable: true })
  encryptionKeyId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}