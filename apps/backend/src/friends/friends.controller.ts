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
  ) {}

  @ApiOperation({ summary: 'Get all friends' })
  @ApiResponse({ status: 200 })
  @Get()
  getFriends(@AuthUser() user: User) {
    return this.friendsService.getFriends(user.id);
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
    this.event.emit(ServerEvents.FRIEND_REMOVED, { friend, userId });
    return friend;
  }
}
