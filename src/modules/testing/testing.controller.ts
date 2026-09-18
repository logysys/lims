import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TestingService } from './testing.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { EnterResultsDto } from './dto/enter-results.dto';
import { UserRole } from '@common/enums';

@ApiTags('Testing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('testing')
export class TestingController {
  constructor(private readonly testingService: TestingService) {}

  @Get('methods')
  async getMethods() {
    return this.testingService.findAllMethods();
  }

  @Get('methods/:id')
  async getMethod(@Param('id') id: string) {
    return this.testingService.findMethodById(id);
  }

  @Get('pending')
  @Roles(UserRole.ANALYST, UserRole.QA)
  async getPending(@CurrentUser('sub') userId: string) {
    return this.testingService.getPendingTests(userId);
  }

  @Get(':id')
  async getTest(@Param('id') id: string) {
    return this.testingService.getTestById(id);
  }

  @Post(':id/start')
  @Roles(UserRole.ANALYST)
  async startTest(
    @Param('id') id: string,
    @Body('instrumentId') instrumentId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.testingService.startTest(id, instrumentId, userId);
  }

  @Post(':id/results')
  @Roles(UserRole.ANALYST)
  async enterResults(
    @Param('id') id: string,
    @Body() dto: EnterResultsDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.testingService.enterResults(id, dto, userId);
  }

  @Post(':id/verify')
  @Roles(UserRole.QA, UserRole.LAB_ADMIN)
  async verify(
    @Param('id') id: string,
    @Body('decision') decision: string,
    @Body('comment') comment: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.testingService.verifyResult(id, decision, comment, userId);
  }
}