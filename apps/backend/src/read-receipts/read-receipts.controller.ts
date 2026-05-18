import { Controller, Get, Inject, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SkipThrottle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Routes, ServerEvents, Services } from '../utils/constants';
import { AuthUser } from '../utils/decorators';
import type { User } from '../utils/typeorm';
import type { IReadReceiptsService } from './read-receipts.interface';

@ApiTags('Read Receipts')
@ApiBearerAuth()
@Controller(Routes.READ_RECEIPTS)
export class ReadReceiptsController {
  constructor(
    @Inject(Services.READ_RECEIPTS)
    private readonly readReceiptsService: IReadReceiptsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Mark all messages in a conversation as read' })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  async markConversationAsRead(
    @AuthUser() user: User,
    @Param('id', ParseUUIDPipe) conversationId: string,
  ) {
    await this.readReceiptsService.markConversationAsRead(
      conversationId,
      user.id,
    );
    this.eventEmitter.emit(ServerEvents.MESSAGE_READ, {
      conversationId,
      userId: user.id,
    });
    return { conversationId, read: true };
  }

  @Get()
  @SkipThrottle()
  @ApiOperation({ summary: 'Get unread message count for a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  async getUnreadCount(
    @AuthUser() user: User,
    @Param('id', ParseUUIDPipe) conversationId: string,
  ) {
    const unreadCount = await this.readReceiptsService.getUnreadCount(
      conversationId,
      user.id,
    );
    return { conversationId, unreadCount };
  }
}
