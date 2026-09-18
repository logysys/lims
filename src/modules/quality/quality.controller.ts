import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { QualityService } from './quality.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole, ReviewType, ReviewDecision } from '@common/enums';

@ApiTags('Quality')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('quality')
export class QualityController {
  constructor(private readonly qualityService: QualityService) {}

  @Get('pending-reviews')
  @Roles(UserRole.QA, UserRole.LAB_ADMIN)
  async getPendingReviews() {
    return this.qualityService.getPendingReviews();
  }

  @Get('reviews/:sampleId')
  async getReviewHistory(@Param('sampleId') sampleId: string) {
    return this.qualityService.getReviewHistory(sampleId);
  }

  @Post('reviews/:sampleId')
  @Roles(UserRole.QA, UserRole.LAB_ADMIN, UserRole.ANALYST)
  async submitReview(
    @Param('sampleId') sampleId: string,
    @Body() body: {
      reviewType: ReviewType;
      decision: ReviewDecision;
      comments?: string;
      signatureMeaning: string;
      stepUpMethod: string;
    },
    @CurrentUser('sub') userId: string,
    @Req() req: Request,
  ) {
    return this.qualityService.submitReview(sampleId, {
      ...body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    }, userId);
  }

  @Post('rejections/:sampleId')
  @Roles(UserRole.QA, UserRole.LAB_ADMIN)
  async createRejection(
    @Param('sampleId') sampleId: string,
    @Body() body: any,
    @CurrentUser('sub') userId: string,
  ) {
    return this.qualityService.createRejection(sampleId, body, userId);
  }

  @Get('signatures/:id')
  async getSignature(@Param('id') id: string) {
    return this.qualityService.getSignatureById(id);
  }

  @Post('signatures/:id/verify')
  async verifySignature(@Param('id') id: string) {
    return this.qualityService.verifySignature(id);
  }
}