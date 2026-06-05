import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { DbKeepaliveService } from './db-keepalive.service';
import { RedisModule } from '../redis/redis.module';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';
import { StorageModule } from '../storage/storage.module';
import { BotModule } from '../bot/bot.module';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [
    RedisModule,
    RabbitMQModule,
    StorageModule,
    BotModule,
    KafkaModule,
    TypeOrmModule.forFeature([]),
  ],
  controllers: [HealthController],
  providers: [DbKeepaliveService],
})
export class HealthModule {}
