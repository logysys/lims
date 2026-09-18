import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/enums';

@ApiTags('API Keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MANUFACTURER, UserRole.SUPER_ADMIN)
@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  async create(
    @Body() body: any,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.apiKeysService.create({
      organizationId: orgId,
      name: body.name,
      scopes: body.scopes,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      ipWhitelist: body.ipWhitelist,
      createdBy: userId,
    });
  }

  @Get()
  async findAll(@CurrentUser('orgId') orgId: string) {
    return this.apiKeysService.findAll(orgId);
  }

  @Post(':id/revoke')
  async revoke(@Param('id') id: string) {
    return this.apiKeysService.revoke(id);
  }
}