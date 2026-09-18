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
import { SamplesService } from './samples.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { CreateBatchDto } from './dto/create-batch.dto';
import { CreateSampleDto } from './dto/create-sample.dto';
import { UserRole } from '@common/enums';

@ApiTags('Samples')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('samples')
export class SamplesController {
  constructor(private readonly samplesService: SamplesService) {}

  @Post('batches')
  @Roles(UserRole.CUSTOMER, UserRole.LAB_ADMIN, UserRole.ANALYST)
  async createBatch(
    @Body() dto: CreateBatchDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.samplesService.createBatch(dto, userId);
  }

  @Post()
  @Roles(UserRole.CUSTOMER, UserRole.LAB_ADMIN, UserRole.ANALYST)
  async createSample(
    @Body() dto: CreateSampleDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.samplesService.createSample(dto, userId);
  }

  @Get()
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
    @Query('batchId') batchId?: string,
    @Query('search') search?: string,
  ) {
    return this.samplesService.findAll({
      page,
      limit,
      status,
      customerId,
      batchId,
      search,
    });
  }

  @Get('my-queue')
  @Roles(UserRole.ANALYST, UserRole.QA)
  async myQueue(@CurrentUser('sub') userId: string) {
    return this.samplesService.getMyQueue(userId);
  }

  @Get('dashboard-stats')
  async dashboardStats() {
    return this.samplesService.getDashboardStats();
  }

  @Get('batches/:id')
  async findBatch(@Param('id') id: string) {
    return this.samplesService.findBatchById(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.samplesService.findById(id);
  }

  @Post(':id/status')
  @Roles(UserRole.ANALYST, UserRole.QA, UserRole.LAB_ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('justification') justification: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.samplesService.updateStatus(id, status, userId, justification);
  }

  @Post(':id/chain-of-custody')
  @Roles(UserRole.ANALYST, UserRole.QA, UserRole.LAB_ADMIN)
  async chainOfCustody(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser('sub') userId: string,
  ) {
    return this.samplesService.recordChainOfCustody(id, body, userId);
  }

  @Post(':id/assign-tests')
  @Roles(UserRole.LAB_ADMIN, UserRole.ANALYST)
  async assignTests(
    @Param('id') id: string,
    @Body('methodIds') methodIds: string[],
    @CurrentUser('sub') userId: string,
  ) {
    return this.samplesService.assignToTests(id, methodIds, userId);
  }

  @Post(':id/assign-storage')
  @Roles(UserRole.LAB_ADMIN, UserRole.ANALYST)
  async assignStorage(
    @Param('id') id: string,
    @Body('location') location: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.samplesService.assignStorageLocation(id, location, userId);
  }
}