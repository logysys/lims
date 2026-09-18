import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/enums';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.LAB_ADMIN, UserRole.ANALYST, UserRole.QA)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('items')
  async createItem(
    @Body() body: any,
    @CurrentUser('sub') userId: string,
  ) {
    return this.inventoryService.createItem(body, userId);
  }

  @Get('items')
  async findAllItems(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('lowStock') lowStock?: string,
  ) {
    return this.inventoryService.findAllItems({
      page,
      limit,
      category,
      status,
      lowStock: lowStock === 'true',
    });
  }

  @Patch('items/:id')
  async updateItem(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser('sub') userId: string,
  ) {
    return this.inventoryService.updateItem(id, body, userId);
  }

  @Post('movements')
  async recordMovement(
    @Body() body: any,
    @CurrentUser('sub') userId: string,
  ) {
    return this.inventoryService.recordMovement(body, userId);
  }

  @Get('movements')
  async getMovements(@Query('itemId') itemId?: string) {
    return this.inventoryService.getMovements(itemId);
  }

  @Post('locations')
  async createLocation(@Body() body: any) {
    return this.inventoryService.createLocation(body);
  }

  @Get('locations')
  async getAllLocations() {
    return this.inventoryService.getAllLocations();
  }

  @Get('locations/tree')
  async getLocationTree() {
    return this.inventoryService.getLocationTree();
  }

  @Get('alerts/low-stock')
  async getLowStockAlerts() {
    return this.inventoryService.getLowStockAlerts();
  }
}