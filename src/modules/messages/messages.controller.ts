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
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  async send(
    @Body() body: any,
    @CurrentUser('sub') userId: string,
  ) {
    return this.messagesService.send({ ...body, senderId: userId });
  }

  @Get('inbox')
  async getInbox(
    @CurrentUser('sub') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.messagesService.getInbox(userId, { page, limit });
  }

  @Get('sent')
  async getSent(
    @CurrentUser('sub') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.messagesService.getSent(userId, { page, limit });
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.messagesService.getById(id);
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: string) {
    await this.messagesService.markAsRead(id);
    return { success: true };
  }

  @Post(':id/reply')
  async reply(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser('sub') userId: string,
  ) {
    return this.messagesService.reply(id, {
      ...body,
      senderId: userId,
      recipientId: body.recipientId,
    });
  }
}