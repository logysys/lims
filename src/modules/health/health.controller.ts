import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Public()
  @Get()
  async check() {
    let dbStatus = 'down';
    try {
      await this.dataSource.query('SELECT 1');
      dbStatus = 'up';
    } catch {
      dbStatus = 'down';
    }

    return {
      status: dbStatus === 'up' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: dbStatus,
      },
    };
  }

  @Public()
  @Get('ready')
  async ready() {
    try {
      await this.dataSource.query('SELECT 1');
      return { ready: true };
    } catch {
      return { ready: false };
    }
  }

  @Public()
  @Get('live')
  async live() {
    return { live: true, timestamp: new Date().toISOString() };
  }
}