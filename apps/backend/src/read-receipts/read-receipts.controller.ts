import {
  Controller,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Routes, ServerEvents, Services } from '../utils/constants';
import { AuthUser } from '../utils/decorators';
import type { User } from '../utils/typeorm';
import type { IReadReceiptsService } from './read-receipts.interface';

@Controller(Routes.READ_RECEIPTS)
@UseGuards(JwtAuthGuard)
export class ReadReceiptsController {
  constructor(
    @Inject(Services.READ_RECEIPTS)
    private readonly readReceiptsService: IReadReceiptsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Post()
  async markConversationAsRead(
    @AuthUser() user: User,
    @Param('id') conversationId: string,
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
  async getUnreadCount(
    @AuthUser() user: User,
    @Param('id') conversationId: string,
  ) {
    const unreadCount = await this.readReceiptsService.getUnreadCount(
      conversationId,
      user.id,
    );
    return { conversationId, unreadCount };
  }
}
