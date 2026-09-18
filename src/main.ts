import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: [
      configService.get<string>('urls.labConsole') ?? 'http://localhost:3001',
      configService.get<string>('urls.customerPortal') ?? 'http://localhost:3002',
      configService.get<string>('urls.manufacturer') ?? 'http://localhost:3003',
      configService.get<string>('urls.consumerPortal') ?? 'http://localhost:3004',
      configService.get<string>('urls.publicVerify') ?? 'http://localhost:3005',
    ],
    credentials: true,
  });

  // WebSocket adapter (must be set BEFORE app.listen)
  app.useWebSocketAdapter(new IoAdapter(app));

  // Global prefix
  app.setGlobalPrefix(configService.get('app.apiPrefix') || 'api/v1');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('TruSource LIMS API')
    .setDescription('Complete LIMS platform API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication')
    .addTag('Users')
    .addTag('Organizations')
    .addTag('Products')
    .addTag('Samples')
    .addTag('Testing')
    .addTag('Quality')
    .addTag('COA')
    .addTag('Public Verification')
    .addTag('Inventory')
    .addTag('Instruments')
    .addTag('Audit')
    .addTag('Notifications')
    .addTag('Messages')
    .addTag('Verified Badges')
    .addTag('Billing')
    .addTag('API Keys')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('app.port') || 3000;
  await app.listen(port);

  logger.log(`🚀 Application running on http://localhost:${port}`);
  logger.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
  logger.log(`🔧 Environment: ${configService.get('app.env')}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});