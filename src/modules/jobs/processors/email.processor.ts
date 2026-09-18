import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { NotificationsService } from '@modules/notifications/notifications.service';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Process('send-verification')
  async handleVerification(job: Job) {
    const { user, token } = job.data;
    this.logger.log(`Sending verification email to ${user.email}`);
    await this.notificationsService.sendEmailVerification(user, token);
  }

  @Process('send-password-reset')
  async handlePasswordReset(job: Job) {
    const { user, token } = job.data;
    this.logger.log(`Sending password reset to ${user.email}`);
    await this.notificationsService.sendPasswordResetEmail(user, token);
  }

  @Process('send-account-approved')
  async handleAccountApproved(job: Job) {
    const { user } = job.data;
    await this.notificationsService.sendAccountApprovedEmail(user);
  }
}