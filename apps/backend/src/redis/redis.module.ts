import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisCacheService } from './redis.cache.service';
import { RedisController } from './redis.controller';

@Module({
  providers: [RedisService, RedisCacheService],
  controllers: [RedisController],
  exports: [RedisService, RedisCacheService],
})
export class RedisModule {}
