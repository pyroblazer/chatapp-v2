import { Controller, Get, Inject, Query } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Routes, Services } from '../utils/constants';
import { AuthUser } from '../utils/decorators';
import type { User } from '../utils/typeorm';
import type { ISearchService } from './search.interface';

@ApiTags('Search')
@ApiBearerAuth()
@Controller(Routes.SEARCH)
export class SearchController {
  constructor(
    @Inject(Services.SEARCH)
    private readonly searchService: ISearchService,
  ) {}

  @Get()
  @SkipThrottle()
  @ApiOperation({ summary: 'Search messages, users, and groups' })
  @ApiQuery({ name: 'q', description: 'Search query', example: 'hello' })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Search type',
    enum: ['messages', 'users', 'groups'],
    example: 'messages',
  })
  @ApiQuery({ name: 'limit', required: false, example: '20' })
  @ApiQuery({ name: 'offset', required: false, example: '0' })
  async search(
    @AuthUser() user: User,
    @Query('q') query: string,
    @Query('type') type = 'messages',
    @Query('limit') limit = '20',
    @Query('offset') offset = '0',
  ) {
    const parsedLimit = parseInt(limit, 10) || 20;
    const parsedOffset = parseInt(offset, 10) || 0;

    switch (type) {
      case 'users':
        return this.searchService.searchUsers(query);
      case 'groups':
        return this.searchService.searchGroups(query, user.id);
      case 'messages':
      default:
        return this.searchService.searchMessages(
          query,
          user.id,
          parsedLimit,
          parsedOffset,
        );
    }
  }
}
