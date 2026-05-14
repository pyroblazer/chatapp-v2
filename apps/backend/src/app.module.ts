import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';
import { GatewayModule } from './gateway/gateway.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import entities from './utils/typeorm';
import { GroupModule } from './groups/group.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { FriendRequestsModule } from './friend-requests/friend-requests.module';
import { FriendsModule } from './friends/friends.module';
import { EventsModule } from './events/events.module';
import { ThrottlerBehindProxyGuard } from './utils/throttler';
import { ExistsModule } from './exists/exists.module';
import { MessageAttachmentsModule } from './message-attachments/message-attachments.module';
import { BaseModule } from './base/base.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { StorageModule } from './storage/storage.module';
import { QueueModule } from './queue/queue.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { TelemetryInterceptor } from './telemetry/telemetry.interceptor';
import { ReactionsModule } from './reactions/reactions.module';
import { ReadReceiptsModule } from './read-receipts/read-receipts.module';
import { SearchModule } from './search/search.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { AuditModule } from './audit/audit.module';
import { BotModule } from './bot/bot.module';
import { BlockedUsersModule } from './blocked-users/blocked-users.module';

let envFilePath = '.env.development';
if (process.env.ENVIRONMENT === 'PRODUCTION') envFilePath = '.env.production';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    ConfigModule.forRoot({ envFilePath }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || process.env.MYSQL_DB_HOST,
      port: parseInt(
        process.env.DATABASE_PORT || process.env.MYSQL_DB_PORT || '5432',
        10,
      ),
      username: process.env.DATABASE_USERNAME || process.env.MYSQL_DB_USERNAME,
      password: process.env.DATABASE_PASSWORD || process.env.MYSQL_DB_PASSWORD,
      database: process.env.DATABASE_NAME || process.env.MYSQL_DB_NAME,
      synchronize: process.env.ENVIRONMENT !== 'PRODUCTION',
      entities,
      logging: process.env.ENVIRONMENT !== 'PRODUCTION' ? ['error'] : false,
      ssl: process.env.DATABASE_SSL === 'true',
    }),
    ConversationsModule,
    MessagesModule,
    GatewayModule,
    EventEmitterModule.forRoot(),
    GroupModule,
    FriendRequestsModule,
    FriendsModule,
    EventsModule,
    ExistsModule,
    ThrottlerModule.forRoot({
      ttl: parseInt(process.env.THROTTLE_TTL || '10', 10),
      limit: parseInt(process.env.THROTTLE_LIMIT || '10', 10),
    }),
    MessageAttachmentsModule,
    BaseModule,
    RedisModule,
    HealthModule,
    RabbitMQModule.forRoot(),
    StorageModule,
    QueueModule,
    TelemetryModule,
    ReactionsModule,
    ReadReceiptsModule,
    SearchModule,
    NotificationsModule,
    AdminModule,
    AuditModule,
    BotModule,
    BlockedUsersModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TelemetryInterceptor,
    },
  ],
})
export class AppModule {}
