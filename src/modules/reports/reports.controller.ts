import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/enums';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  async dashboard(
    @Query('orgId') orgId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getDashboardMetrics(
      orgId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('trends')
  async trends(
    @Query('productId') productId: string,
    @Query('parameter') parameter: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getTrendData(
      productId,
      parameter,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('coa-stats')
  async coaStats(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.getCOAStats(
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('samples/export')
  @Roles(UserRole.LAB_ADMIN, UserRole.QA, UserRole.CUSTOMER)
  async exportSamples(
    @Res() res: Response,
    @CurrentUser('orgId') orgId: string,
    @Query('status') status?: string,
  ) {
    const buffer = await this.reportsService.exportSamplesToExcel(orgId, status);
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="samples-${Date.now()}.xlsx"`,
    });
    res.send(buffer);
  }
}