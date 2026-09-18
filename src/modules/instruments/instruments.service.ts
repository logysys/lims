import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Instrument } from './entities/instrument.entity';
import { AuditService } from '@modules/audit/audit.service';
import { AuditAction, InstrumentStatus } from '@common/enums';

@Injectable()
export class InstrumentsService {
  constructor(
    @InjectRepository(Instrument)
    private readonly instrumentRepository: Repository<Instrument>,
    private readonly auditService: AuditService,
  ) {}

  async create(data: Partial<Instrument>, userId: string) {
    const instrument = this.instrumentRepository.create(data);
    const saved = await this.instrumentRepository.save(instrument);

    await this.auditService.log({
      userId,
      action: AuditAction.CREATE,
      resourceType: 'instrument',
      resourceId: saved.id,
      newValues: { name: saved.name, code: saved.instrumentCode },
    });

    return saved;
  }

  async findAll(options: { page?: number; limit?: number; status?: string; type?: string }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const qb = this.instrumentRepository.createQueryBuilder('instrument');

    if (options.status) {
      qb.andWhere('instrument.status = :status', { status: options.status });
    }
    if (options.type) {
      qb.andWhere('instrument.type = :type', { type: options.type });
    }

    qb.orderBy('instrument.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findById(id: string) {
    const instrument = await this.instrumentRepository.findOne({ where: { id } });
    if (!instrument) throw new NotFoundException('Instrument not found');
    return instrument;
  }

  async updateStatus(id: string, status: InstrumentStatus, userId: string) {
    const instrument = await this.findById(id);
    await this.instrumentRepository.update(id, { status });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      resourceType: 'instrument',
      resourceId: id,
      oldValues: { status: instrument.status },
      newValues: { status },
    });

    return this.findById(id);
  }

  async recordCalibration(
    id: string,
    data: {
      calibrationDate: Date;
      nextCalibrationDate: Date;
      certificateUrl?: string;
      performedBy?: string;
      notes?: string;
    },
    userId: string,
  ) {
    const instrument = await this.findById(id);

    await this.instrumentRepository.update(id, {
      lastCalibrationDate: data.calibrationDate,
      nextCalibrationDate: data.nextCalibrationDate,
      calibrationCertificateUrl: data.certificateUrl,
      status: InstrumentStatus.OPERATIONAL,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      resourceType: 'instrument_calibration',
      resourceId: id,
      oldValues: {
        lastCalibrationDate: instrument.lastCalibrationDate,
        nextCalibrationDate: instrument.nextCalibrationDate,
      },
      newValues: data,
    });

    return this.findById(id);
  }

  async getStatusDashboard() {
    const [operational, maintenance, calibration, offline, retired, all] = await Promise.all([
      this.instrumentRepository.count({ where: { status: InstrumentStatus.OPERATIONAL } }),
      this.instrumentRepository.count({ where: { status: InstrumentStatus.MAINTENANCE } }),
      this.instrumentRepository.count({ where: { status: InstrumentStatus.CALIBRATION } }),
      this.instrumentRepository.count({ where: { status: InstrumentStatus.OFFLINE } }),
      this.instrumentRepository.count({ where: { status: InstrumentStatus.RETIRED } }),
      this.instrumentRepository.count(),
    ]);

    const calibrationDue = await this.instrumentRepository
      .createQueryBuilder('i')
      .where('i.nextCalibrationDate <= :date', {
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
      .andWhere('i.nextCalibrationDate >= :today', { today: new Date() })
      .getMany();

    return {
      counts: { operational, maintenance, calibration, offline, retired, total: all },
      calibrationDue,
    };
  }
}