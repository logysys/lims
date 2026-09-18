import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { Public } from '@common/decorators/public.decorator';

@ApiTags('Public Verification')
@Controller('verify')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Public()
  @Get('search')
  async search(
    @Query('q') query: string,
    @Query('scope') scope?: string,
  ) {
    if (!query || query.length < 3) {
      return { data: [], message: 'Query must be at least 3 characters' };
    }
    const data = await this.verificationService.search(query, scope);
    return { data };
  }

  @Public()
  @Get('coa/:coaId')
  async getByCoaId(@Param('coaId') coaId: string) {
    return this.verificationService.getByCoaId(coaId);
  }

  @Public()
  @Get('record/:id')
  async getById(@Param('id') id: string) {
    return this.verificationService.getById(id);
  }

  @Public()
  @Get('lot/:lotNumber')
  async getByLot(@Param('lotNumber') lotNumber: string) {
    return this.verificationService.getByLotNumber(lotNumber);
  }

  @Public()
  @Get('badge/:badgeCode')
  async getByBadge(@Param('badgeCode') badgeCode: string) {
    return this.verificationService.getByBadgeCode(badgeCode);
  }

  @Public()
  @Post(':id/scan')
  async recordScan(@Param('id') id: string) {
    await this.verificationService.recordScan(id);
    return { success: true };
  }

  @Public()
  @Post(':id/download')
  async recordDownload(@Param('id') id: string) {
    await this.verificationService.recordDownload(id);
    return { success: true };
  }
}