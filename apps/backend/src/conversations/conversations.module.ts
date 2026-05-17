import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const passport = require('passport');
import { FriendsModule } from '../friends/friends.module';
import { UsersModule } from '../users/users.module';
import { Services } from '../utils/constants';
import { Conversation, Message } from '../utils/typeorm';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { ConversationMiddleware } from './middlewares/conversation.middleware';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message]),
    UsersModule,
    FriendsModule,
  ],
  controllers: [ConversationsController],
  providers: [
    {
      provide: Services.CONVERSATIONS,
      useClass: ConversationsService,
    },
  ],
  exports: [Services.CONVERSATIONS],
})
export class ConversationsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        passport.authenticate('jwt', { session: false }),
        ConversationMiddleware,
      )
      .forRoutes('conversations/:id');
  }
}
