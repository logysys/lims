import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Instrument } from '@modules/instruments/entities/instrument.entity';
import { InventoryItem } from '@modules/inventory/entities/inventory-item.entity';
import { SampleBatch } from '@modules/samples/entities/sample-batch.entity';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { UsersService } from '@modules/users/users.service';

@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name);

  constructor(
    @InjectRepository(Instrument)
    private readonly instrumentRepository: Repository<Instrument>,
    @InjectRepository(InventoryItem)
    private readonly inventoryRepository: Repository<InventoryItem>,
    @InjectRepository(SampleBatch)
    private readonly batchRepository: Repository<SampleBatch>,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async checkCalibrationDue() {
    this.logger.log('Running daily calibration check');
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const instruments = await this.instrumentRepository
      .createQueryBuilder('i')
      .where('i.nextCalibrationDate <= :dueDate', { dueDate })
      .andWhere('i.nextCalibrationDate >= :today', { today: new Date() })
      .getMany();

    if (instruments.length === 0) return;

    const admins = await this.usersService.findAll({ role: 'lab_admin' });
    for (const admin of admins.data) {
      await this.notificationsService.sendNotification(
        admin.id,
        'Calibration Due Soon',
        `${instruments.length} instrument(s) require calibration within 7 days`,
        { actionUrl: '/instruments', actionText: 'View Instruments', priority: 'high' },
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async checkLowStock() {
    this.logger.log('Running low-stock check');
    const lowStock = await this.inventoryRepository
      .createQueryBuilder('item')
      .where('item.quantity <= item.minimumQuantity')
      .andWhere('item.status != :status', { status: 'disposed' })
      .getMany();

    if (lowStock.length === 0) return;

    const admins = await this.usersService.findAll({ role: 'lab_admin' });
    for (const admin of admins.data) {
      await this.notificationsService.sendNotification(
        admin.id,
        'Low Stock Alert',
        `${lowStock.length} inventory item(s) are below minimum quantity`,
        { actionUrl: '/inventory', actionText: 'View Inventory', priority: 'high' },
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkOverdueSamples() {
    this.logger.log('Running overdue samples check');
    const overdue = await this.batchRepository
      .createQueryBuilder('batch')
      .where('batch.dueDate < :today', { today: new Date() })
      .andWhere('batch.status NOT IN (:...statuses)', {
        statuses: ['released', 'archived', 'rejected'],
      })
      .getMany();

    if (overdue.length === 0) return;

    const analysts = await this.usersService.findAll({ role: 'analyst' });
    for (const analyst of analysts.data) {
      await this.notificationsService.sendNotification(
        analyst.id,
        'Overdue Samples',
        `${overdue.length} sample batch(es) are past their due date`,
        { actionUrl: '/samples?overdue=true', actionText: 'View Samples', priority: 'critical' },
      );
    }
  }

  @Cron('0 0 * * * *') // Every hour
  async cleanupExpiredSessions() {
    this.logger.debug('Cleaning up expired sessions');
    // Session cleanup handled by repository
  }
}