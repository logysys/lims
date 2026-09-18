import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InstrumentsService } from './instruments.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole, InstrumentStatus } from '@common/enums';

@ApiTags('Instruments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('instruments')
export class InstrumentsController {
  constructor(private readonly instrumentsService: InstrumentsService) {}

  @Post()
  @Roles(UserRole.LAB_ADMIN)
  async create(
    @Body() body: any,
    @CurrentUser('sub') userId: string,
  ) {
    return this.instrumentsService.create(body, userId);
  }

  @Get()
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.instrumentsService.findAll({ page, limit, status, type });
  }

  @Get('dashboard')
  async dashboard() {
    return this.instrumentsService.getStatusDashboard();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.instrumentsService.findById(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.LAB_ADMIN, UserRole.ANALYST)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: InstrumentStatus,
    @CurrentUser('sub') userId: string,
  ) {
    return this.instrumentsService.updateStatus(id, status, userId);
  }

  @Post(':id/calibration')
  @Roles(UserRole.LAB_ADMIN, UserRole.ANALYST)
  async recordCalibration(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser('sub') userId: string,
  ) {
    return this.instrumentsService.recordCalibration(id, body, userId);
  }
}