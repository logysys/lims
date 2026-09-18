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
import { BadgesService } from './badges.service';
import { Public } from '@common/decorators/public.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums';

@ApiTags('Verified Badges')
@Controller('badges')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Public()
  @Get('code/:code')
  async getByCode(@Param('code') code: string) {
    return this.badgesService.getByCode(code);
  }

  @Public()
  @Post('code/:code/view')
  async recordView(@Param('code') code: string) {
    const badge = await this.badgesService.getByCode(code);
    await this.badgesService.recordView(badge.id);
    return { success: true };
  }

  @Public()
  @Post('code/:code/click')
  async recordClick(@Param('code') code: string) {
    const badge = await this.badgesService.getByCode(code);
    await this.badgesService.recordClick(badge.id);
    return { success: true };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANUFACTURER, UserRole.LAB_ADMIN, UserRole.SUPER_ADMIN)
  @Post()
  async generate(@Body() body: any) {
    return this.badgesService.generate(body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.badgesService.findAll({ page, limit, status });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.badgesService.getById(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANUFACTURER, UserRole.LAB_ADMIN, UserRole.SUPER_ADMIN)
  @Post(':id/revoke')
  async revoke(@Param('id') id: string) {
    return this.badgesService.revoke(id);
  }
}