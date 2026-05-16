import { Controller, Get, Optional } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../utils/public.decorator';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { RedisService } from '../redis/redis.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { StorageService } from '../storage/storage.service';
import { AiService } from '../bot/ai/ai.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly redisService: RedisService,
    @InjectConnection()
    private readonly connection: Connection,
    @Optional() private readonly rabbitMQService?: RabbitMQService,
    @Optional() private readonly storageService?: StorageService,
    @Optional() private readonly aiService?: AiService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async check() {
    const services: Record<string, string> = {};
    let overallStatus = 'ok';

    // Check PostgreSQL (critical)
    try {
      if (this.connection.isConnected) {
        await this.connection.query('SELECT 1');
        services.postgresql = 'up';
      } else {
        services.postgresql = 'down';
        overallStatus = 'down';
      }
    } catch {
      services.postgresql = 'down';
      overallStatus = 'down';
    }

    // Check Redis (non-critical)
    try {
      const result = await this.redisService.ping();
      services.redis = result === 'PONG' ? 'up' : 'down';
    } catch {
      services.redis = 'down';
    }
    if (services.redis === 'down' && overallStatus !== 'down') {
      overallStatus = 'degraded';
    }

    // Check RabbitMQ (non-critical)
    if (this.rabbitMQService) {
      services.rabbitmq = this.rabbitMQService.isAvailable() ? 'up' : 'down';
    } else {
      services.rabbitmq = 'down';
    }
    if (services.rabbitmq === 'down' && overallStatus !== 'down') {
      overallStatus = 'degraded';
    }

    // Check MinIO (non-critical)
    if (this.storageService) {
      services.minio = this.storageService.isAvailable() ? 'up' : 'down';
    } else {
      services.minio = 'down';
    }
    if (services.minio === 'down' && overallStatus !== 'down') {
      overallStatus = 'degraded';
    }

    // Check Ollama (non-critical)
    if (this.aiService) {
      services.ollama = this.aiService.isAvailable() ? 'up' : 'down';
    } else {
      services.ollama = 'down';
    }
    if (services.ollama === 'down' && overallStatus !== 'down') {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      services,
      timestamp: new Date().toISOString(),
    };
  }
}
