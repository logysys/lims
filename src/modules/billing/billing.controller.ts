import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/enums';

@ApiTags('Billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('invoices')
  @Roles(UserRole.CUSTOMER, UserRole.MANUFACTURER, UserRole.LAB_ADMIN)
  async getInvoices(
    @CurrentUser('orgId') orgId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.billingService.getInvoices(orgId, { page, limit, status });
  }

  @Get('invoices/:id')
  async getInvoice(@Param('id') id: string) {
    return this.billingService.getInvoiceById(id);
  }

  @Get('dashboard')
  @Roles(UserRole.CUSTOMER, UserRole.MANUFACTURER, UserRole.LAB_ADMIN)
  async dashboard(@CurrentUser('orgId') orgId: string) {
    return this.billingService.getDashboardStats(orgId);
  }

  @Post('invoices')
  @Roles(UserRole.SUPER_ADMIN, UserRole.LAB_ADMIN)
  async createInvoice(@Body() body: any) {
    return this.billingService.createInvoice(body);
  }

  @Post('invoices/:id/pay')
  async pay(
    @Param('id') id: string,
    @Body('paymentIntentId') paymentIntentId: string,
  ) {
    return this.billingService.markAsPaid(id, paymentIntentId);
  }
}