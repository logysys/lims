import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SecureMessage } from './entities/secure-message.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(SecureMessage)
    private readonly messageRepository: Repository<SecureMessage>,
  ) {}

  async send(data: Partial<SecureMessage>) {
    const message = this.messageRepository.create(data);
    return this.messageRepository.save(message);
  }

  async getInbox(userId: string, options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;

    const [data, total] = await this.messageRepository.findAndCount({
      where: { recipientId: userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async getSent(userId: string, options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;

    const [data, total] = await this.messageRepository.findAndCount({
      where: { senderId: userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async getById(id: string) {
    const message = await this.messageRepository.findOne({ where: { id } });
    if (!message) throw new NotFoundException('Message not found');
    return message;
  }

  async markAsRead(id: string) {
    await this.messageRepository.update(id, {
      status: 'read',
      readAt: new Date(),
    });
  }

  async reply(parentId: string, data: Partial<SecureMessage>) {
    const parent = await this.getById(parentId);
    await this.messageRepository.update(parentId, { repliedAt: new Date() });

    return this.send({
      ...data,
      parentMessageId: parentId,
    });
  }
}