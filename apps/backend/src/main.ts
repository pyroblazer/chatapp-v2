import 'reflect-metadata';
import { HttpStatus, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WebsocketAdapter } from './gateway/gateway.adapter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { SanitizePipe } from './pipes/sanitize.pipe';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const { PORT } = process.env;
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const adapter = new WebsocketAdapter(app);
  app.useWebSocketAdapter(adapter);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'", 'ws:', 'wss:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new SanitizePipe(),
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }),
  );
  app.use(cookieParser());
  app.set('trust proxy', 'loopback');

  const config = new DocumentBuilder()
    .setTitle('ChatApp API')
    .setDescription('Production-grade chat application API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication and authorization')
    .addTag('Users', 'User management, profiles, and presence')
    .addTag('Conversations', 'Direct message conversations')
    .addTag('Messages', 'Messages within conversations')
    .addTag('Groups', 'Group channels and group management')
    .addTag('Friends', 'Friends and friend requests')
    .addTag('Reactions', 'Message reactions')
    .addTag('Read Receipts', 'Message read receipts')
    .addTag('Search', 'Search across messages, users, and groups')
    .addTag('Notifications', 'User notifications')
    .addTag('Blocked Users', 'User blocking')
    .addTag('Admin', 'Admin and moderation endpoints')
    .addTag('Bots', 'AI bot conversations')
    .addTag('Health', 'Health checks and system info')
    .addTag('Storage', 'File storage')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  try {
    await app.listen(PORT);
    logger.log(`Running on Port ${PORT}`);
  } catch (err) {
    logger.error('Failed to start server', err);
  }
}
bootstrap();
