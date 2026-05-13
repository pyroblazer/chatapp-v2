import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisCacheService } from './redis.cache.service';

@Module({
  providers: [RedisService, RedisCacheService],
  exports: [RedisService, RedisCacheService],
})
export class RedisModule {}
