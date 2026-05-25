import {
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { RedisCacheService } from '../redis/redis.cache.service';
import { Routes, ServerEvents, Services } from '../utils/constants';
import { AuthUser } from '../utils/decorators';
import type { User } from '../utils/typeorm';
import type { IFriendsService } from './friends';

@SkipThrottle()
@ApiTags('Friends')
@ApiBearerAuth()
@Controller(Routes.FRIENDS)
export class FriendsController {
  constructor(
    @Inject(Services.FRIENDS_SERVICE)
    private readonly friendsService: IFriendsService,
    private readonly event: EventEmitter2,
    private readonly cache: RedisCacheService,
  ) {}

  @ApiOperation({ summary: 'Get all friends' })
  @ApiResponse({ status: 200 })
  @Get()
  async getFriends(@AuthUser() user: User) {
    const cached = await this.cache.getCached(`friends:${user.id}`);
    if (cached) return cached;
    const friends = await this.friendsService.getFriends(user.id);
    await this.cache.setCache(`friends:${user.id}`, friends);
    return friends;
  }

  @ApiOperation({ summary: 'Remove a friend' })
  @ApiParam({ name: 'id', description: 'Friend UUID' })
  @ApiResponse({ status: 200 })
  @Delete(':id/delete')
  async deleteFriend(
    @AuthUser() { id: userId }: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const friend = await this.friendsService.deleteFriend({ id, userId });
    await this.cache.invalidatePattern(`friends:*`);
    this.event.emit(ServerEvents.FRIEND_REMOVED, { friend, userId });
    return friend;
  }
}
