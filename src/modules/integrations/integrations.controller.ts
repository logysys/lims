import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/enums';

@ApiTags('Integrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MANUFACTURER, UserRole.LAB_ADMIN, UserRole.SUPER_ADMIN)
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Post('webhook/test')
  async testWebhook(@Body() body: { url: string; secret: string }) {
    return this.integrationsService.testWebhook(body.url, body.secret);
  }

  @Post('erp/sync')
  async syncErp(
    @CurrentUser('orgId') orgId: string,
    @Body('system') system: 'sap' | 'oracle' | 'netsuite',
  ) {
    return this.integrationsService.syncToErp(orgId, system);
  }
}