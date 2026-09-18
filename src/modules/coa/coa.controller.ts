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
import { CoaService } from './coa.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/enums';

@ApiTags('COA')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('coa')
export class CoaController {
  constructor(private readonly coaService: CoaService) {}

  @Get('templates')
  async getTemplates() {
    return this.coaService.getTemplates();
  }

  @Post('templates')
  @Roles(UserRole.LAB_ADMIN, UserRole.QA)
  async createTemplate(
    @Body() body: any,
    @CurrentUser('sub') userId: string,
  ) {
    return this.coaService.createTemplate(body, userId);
  }

  @Post('generate/:sampleId')
  @Roles(UserRole.QA, UserRole.LAB_ADMIN)
  async generate(
    @Param('sampleId') sampleId: string,
    @Body('templateId') templateId: string,
    @Body('notes') notes: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.coaService.generateCoa(sampleId, templateId, userId, notes);
  }

  @Post('batch-generate')
  @Roles(UserRole.QA, UserRole.LAB_ADMIN)
  async batchGenerate(
    @Body('sampleIds') sampleIds: string[],
    @Body('templateId') templateId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.coaService.batchGenerate(sampleIds, templateId, userId);
  }

  @Get()
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sampleId') sampleId?: string,
  ) {
    return this.coaService.findAll({ page, limit, sampleId });
  }

  @Get('verify-chain')
  @Roles(UserRole.SUPER_ADMIN, UserRole.QA)
  async verifyChain() {
    return this.coaService.verifyChain();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.coaService.getCoaById(id);
  }
}