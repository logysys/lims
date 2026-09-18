import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getMyNotifications(
    @CurrentUser('sub') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.notificationsService.getForUser(userId, limit);
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: string) {
    await this.notificationsService.markAsRead(id);
    return { success: true };
  }

  @Post('read-all')
  async markAllAsRead(@CurrentUser('sub') userId: string) {
    await this.notificationsService.markAllAsRead(userId);
    return { success: true };
  }
}