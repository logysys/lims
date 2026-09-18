import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConsumerService } from './consumer.service';
import { Public } from '@common/decorators/public.decorator';

@ApiTags('Consumer Portal')
@Controller('consumer')
export class ConsumerController {
  constructor(private readonly consumerService: ConsumerService) {}

  @Public()
  @Get('browse')
  async browse(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('category') category?: string,
    @Query('sort') sort?: 'featured' | 'newest' | 'popular',
    @Query('search') search?: string,
  ) {
    return this.consumerService.browseProducts({
      page,
      limit,
      category,
      sort,
      search,
    });
  }

  @Public()
  @Get('product/:name')
  async productDetail(@Param('name') name: string) {
    return this.consumerService.getProductDetail(name);
  }

  @Public()
  @Get('badge/:code')
  async badgeDetail(@Param('code') code: string) {
    return this.consumerService.getBadgeDetail(code);
  }

  @Public()
  @Get('featured')
  async featured() {
    return this.consumerService.getFeaturedCollections();
  }
}