import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.LAB_ADMIN)
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: string,
    @Query('orgId') orgId?: string,
  ) {
    return this.usersService.findAll({ page, limit, role, orgId });
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.LAB_ADMIN)
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.LAB_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() data: any,
    @CurrentUser('sub') actorId: string,
  ) {
    // Prevent updating sensitive fields directly
    delete data.passwordHash;
    delete data.mfaSecret;
    return this.usersService.update(id, data);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.LAB_ADMIN)
  async remove(@Param('id') id: string) {
    await this.usersService.delete(id);
    return { message: 'User deleted' };
  }
}