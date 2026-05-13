import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Services } from '../utils/constants';
import { MessageReaction, GroupMessageReaction } from '../utils/typeorm';
import { ReactionsController } from './reactions.controller';
import { ReactionsService } from './reactions.service';

@Module({
  imports: [TypeOrmModule.forFeature([MessageReaction, GroupMessageReaction])],
  controllers: [ReactionsController],
  providers: [
    {
      provide: Services.REACTIONS,
      useClass: ReactionsService,
    },
  ],
  exports: [Services.REACTIONS],
})
export class ReactionsModule {}
