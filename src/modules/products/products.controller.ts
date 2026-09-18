import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/enums';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(UserRole.MANUFACTURER, UserRole.LAB_ADMIN)
  async create(
    @Body() body: any,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.productsService.create({ ...body, manufacturerId: orgId });
  }

  @Get()
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('manufacturerId') manufacturerId?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.productsService.findAll({
      page,
      limit,
      manufacturerId,
      category,
      search,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.MANUFACTURER, UserRole.LAB_ADMIN)
  async update(@Param('id') id: string, @Body() body: any) {
    return this.productsService.update(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.MANUFACTURER, UserRole.LAB_ADMIN)
  async remove(@Param('id') id: string) {
    await this.productsService.delete(id);
    return { success: true };
  }
}