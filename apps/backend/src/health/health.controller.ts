import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { RedisService } from '../redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly redisService: RedisService,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  @Get()
  async check() {
    const services: Record<string, string> = {};
    let overallStatus = 'ok';

    // Check PostgreSQL
    try {
      if (this.connection.isConnected) {
        await this.connection.query('SELECT 1');
        services.postgresql = 'up';
      } else {
        services.postgresql = 'down';
        overallStatus = 'degraded';
      }
    } catch {
      services.postgresql = 'down';
      overallStatus = 'degraded';
    }

    // Check Redis
    try {
      const result = await this.redisService.ping();
      services.redis = result === 'PONG' ? 'up' : 'down';
      if (services.redis === 'down') {
        overallStatus = 'degraded';
      }
    } catch {
      services.redis = 'down';
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      services,
      timestamp: new Date().toISOString(),
    };
  }
}
