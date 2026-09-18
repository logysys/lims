import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
  ) {}

  async getInvoices(orgId: string, options?: { page?: number; limit?: number; status?: string }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const qb = this.invoiceRepository.createQueryBuilder('invoice');

    qb.andWhere('invoice.organizationId = :orgId', { orgId });
    if (options?.status) {
      qb.andWhere('invoice.status = :status', { status: options.status });
    }

    qb.orderBy('invoice.issueDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async getInvoiceById(id: string) {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async createInvoice(data: Partial<Invoice>) {
    const invoice = this.invoiceRepository.create(data);
    return this.invoiceRepository.save(invoice);
  }

  async markAsPaid(id: string, paymentIntentId: string) {
    await this.invoiceRepository.update(id, {
      status: 'paid',
      paidDate: new Date(),
      stripePaymentIntentId: paymentIntentId,
    });
    return this.getInvoiceById(id);
  }

  async getDashboardStats(orgId: string) {
    const [pending, overdue, paid, total] = await Promise.all([
      this.invoiceRepository.count({ where: { organizationId: orgId, status: 'sent' } }),
      this.invoiceRepository.count({ where: { organizationId: orgId, status: 'overdue' } }),
      this.invoiceRepository.count({ where: { organizationId: orgId, status: 'paid' } }),
      this.invoiceRepository.count({ where: { organizationId: orgId } }),
    ]);

    const outstanding = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.totalAmount)', 'sum')
      .where('invoice.organizationId = :orgId', { orgId })
      .andWhere('invoice.status IN (:...statuses)', { statuses: ['sent', 'overdue'] })
      .getRawOne();

    return {
      counts: { pending, overdue, paid, total },
      outstandingAmount: parseFloat(outstanding?.sum || '0'),
    };
  }
}