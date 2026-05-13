import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Services } from '../utils/constants';
import {
  Message,
  GroupMessage,
  User,
  Group,
  Conversation,
} from '../utils/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Message,
      GroupMessage,
      User,
      Group,
      Conversation,
    ]),
  ],
  controllers: [SearchController],
  providers: [
    {
      provide: Services.SEARCH,
      useClass: SearchService,
    },
  ],
  exports: [Services.SEARCH],
})
export class SearchModule {}
