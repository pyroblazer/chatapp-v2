import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Routes, Services } from '../utils/constants';
import { AuthUser } from '../utils/decorators';
import type { User } from '../utils/typeorm';
import type { ISearchService } from './search.interface';

@Controller(Routes.SEARCH)
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(
    @Inject(Services.SEARCH)
    private readonly searchService: ISearchService,
  ) {}

  @Get()
  @SkipThrottle()
  async search(
    @AuthUser() user: User,
    @Query('q') query: string,
    @Query('type') type: string = 'messages',
    @Query('limit') limit: string = '20',
    @Query('offset') offset: string = '0',
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
