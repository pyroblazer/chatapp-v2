import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { RedisModule } from '../redis/redis.module';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';
import { StorageModule } from '../storage/storage.module';
import { BotModule } from '../bot/bot.module';

@Module({
  imports: [
    RedisModule,
    RabbitMQModule,
    StorageModule,
    BotModule,
    TypeOrmModule.forFeature([]),
  ],
  controllers: [HealthController],
})
export class HealthModule {}
