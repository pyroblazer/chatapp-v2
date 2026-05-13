import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule, TypeOrmModule.forFeature([])],
  controllers: [HealthController],
})
export class HealthModule {}
