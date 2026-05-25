import { Module } from '@nestjs/common';
import { ConversationsModule } from '../conversations/conversations.module';
import { FriendsModule } from '../friends/friends.module';
import { GroupModule } from '../groups/group.module';
import { RedisModule } from '../redis/redis.module';
import { CallHistoryModule } from '../calls/call-history.module';
import { Services } from '../utils/constants';
import { MessagingGateway } from './gateway';
import { GatewaySessionManager } from './gateway.session';
import { SocketRateLimiter } from './gateway.rate-limit';

@Module({
  imports: [ConversationsModule, GroupModule, FriendsModule, RedisModule, CallHistoryModule],
  providers: [
    MessagingGateway,
    {
      provide: Services.GATEWAY_SESSION_MANAGER,
      useClass: GatewaySessionManager,
    },
    SocketRateLimiter,
  ],
  exports: [Services.GATEWAY_SESSION_MANAGER, MessagingGateway],
})
export class GatewayModule {}
