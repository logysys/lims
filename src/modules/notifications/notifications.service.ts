import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { Notification } from './entities/notification.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;

  constructor(
		@InjectRepository(Notification)
		private readonly notificationRepository: Repository<Notification>,
		private readonly configService: ConfigService,
		private readonly eventEmitter: EventEmitter2,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('smtp.host') || 'localhost',
      port: this.configService.get('smtp.port') || 587,
      auth: this.configService.get('smtp.user')
        ? {
            user: this.configService.get('smtp.user'),
            pass: this.configService.get('smtp.password'),
          }
        : undefined,
    });
  }

  async create(data: Partial<Notification>) {
    const notification = this.notificationRepository.create(data);
    return this.notificationRepository.save(notification);
  }

  async getForUser(userId: string, limit = 50) {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async markAsRead(id: string) {
    await this.notificationRepository.update(id, {
      status: 'read',
      readAt: new Date(),
    });
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ status: 'read', readAt: new Date() })
      .where('userId = :userId AND status != :status', { userId, status: 'read' })
      .execute();
  }

  async sendEmailVerification(user: any, token: string) {
    const verifyUrl = `${this.configService.get('urls.customerPortal')}/verify-email?token=${token}`;
    try {
      await this.transporter.sendMail({
        from: this.configService.get('smtp.from'),
        to: user.email,
        subject: 'Verify your TruSource account',
        html: `
          <h2>Welcome to TruSource LIMS</h2>
          <p>Hello ${user.firstName || 'there'},</p>
          <p>Please verify your email by clicking the link below:</p>
          <a href="${verifyUrl}">Verify Email</a>
          <p>If you did not create this account, please ignore this email.</p>
        `,
      });
    } catch (err) {
      this.logger.warn(`Failed to send verification email: ${err.message}`);
    }

    await this.create({
      userId: user.id,
      type: 'email',
      title: 'Verify your email',
      message: 'Please verify your email address',
      status: 'sent',
      sentAt: new Date(),
    });
  }

  async sendPasswordResetEmail(user: any, token: string) {
    const resetUrl = `${this.configService.get('urls.customerPortal')}/reset-password?token=${token}`;
    try {
      await this.transporter.sendMail({
        from: this.configService.get('smtp.from'),
        to: user.email,
        subject: 'Reset your TruSource password',
        html: `
          <h2>Password Reset Request</h2>
          <p>Click the link below to reset your password (valid for 1 hour):</p>
          <a href="${resetUrl}">Reset Password</a>
        `,
      });
    } catch (err) {
      this.logger.warn(`Failed to send password reset email: ${err.message}`);
    }
  }

  async sendAccountApprovedEmail(user: any) {
    try {
      await this.transporter.sendMail({
        from: this.configService.get('smtp.from'),
        to: user.email,
        subject: 'Your TruSource account has been approved',
        html: `
          <h2>Account Approved</h2>
          <p>Hello ${user.firstName},</p>
          <p>Your TruSource account has been approved. You can now log in.</p>
          <p><strong>Important:</strong> You must set up MFA on first login.</p>
        `,
      });
    } catch (err) {
      this.logger.warn(`Failed to send approval email: ${err.message}`);
    }
  }

  async sendNotification(
	  userId: string,
	  title: string,
	  message: string,
	  options?: { actionUrl?: string; actionText?: string; priority?: string; category?: string },
	) {
	  const notification = await this.create({
		userId,
		type: 'in_app',
		title,
		message,
		actionUrl: options?.actionUrl,
		actionText: options?.actionText,
		priority: options?.priority || 'normal',
		category: options?.category,
		status: 'delivered',
		deliveredAt: new Date(),
	  });

	  // Emit realtime event
	  this.eventEmitter.emit('notification.created', {
		userId,
		notification,
	  });

	  return notification;
	}
}