import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { Routes, ServerEvents, Services } from '../utils/constants';
import { AuthUser } from '../utils/decorators';
import type { User } from '../utils/typeorm';
import { CreateFriendDto } from './dtos/CreateFriend.dto';
import type { IFriendRequestService } from './friend-requests';

@ApiTags('Friends')
@ApiBearerAuth()
@Controller(Routes.FRIEND_REQUESTS)
export class FriendRequestController {
  constructor(
    @Inject(Services.FRIENDS_REQUESTS_SERVICE)
    private readonly friendRequestService: IFriendRequestService,
    private event: EventEmitter2,
  ) {}

  @ApiOperation({ summary: 'Get all friend requests' })
  @ApiResponse({ status: 200 })
  @Get()
  getFriendRequests(@AuthUser() user: User) {
    return this.friendRequestService.getFriendRequests(user.id);
  }

  @ApiOperation({ summary: 'Send a friend request' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 429 })
  @Throttle(3, 10)
  @HttpCode(HttpStatus.CREATED)
  @Post()
  async createFriendRequest(
    @AuthUser() user: User,
    @Body() { username }: CreateFriendDto,
  ) {
    const params = { user, username };
    const friendRequest = await this.friendRequestService.create(params);
    this.event.emit('friendrequest.create', friendRequest);
    return friendRequest;
  }

  @ApiOperation({ summary: 'Accept a friend request' })
  @ApiParam({ name: 'id', description: 'Friend request UUID' })
  @ApiResponse({ status: 200 })
  @Throttle(3, 10)
  @Patch(':id/accept')
  async acceptFriendRequest(
    @AuthUser() { id: userId }: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const response = await this.friendRequestService.accept({
      id,
      userId,
    });
    this.event.emit(ServerEvents.FRIEND_REQUEST_ACCEPTED, response);
    return response;
  }

  @ApiOperation({ summary: 'Cancel a friend request' })
  @ApiParam({ name: 'id', description: 'Friend request UUID' })
  @ApiResponse({ status: 200 })
  @Throttle(3, 10)
  @Delete(':id/cancel')
  async cancelFriendRequest(
    @AuthUser() { id: userId }: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const response = await this.friendRequestService.cancel({
      id,
      userId,
    });
    this.event.emit('friendrequest.cancel', response);
    return response;
  }

  @ApiOperation({ summary: 'Reject a friend request' })
  @ApiParam({ name: 'id', description: 'Friend request UUID' })
  @ApiResponse({ status: 200 })
  @Throttle(3, 10)
  @Patch(':id/reject')
  async rejectFriendRequest(
    @AuthUser() { id: userId }: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const response = await this.friendRequestService.reject({
      id,
      userId,
    });
    this.event.emit(ServerEvents.FRIEND_REQUEST_REJECTED, response);
    return response;
  }
}
