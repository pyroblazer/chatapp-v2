import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Routes, ServerEvents, Services } from '../utils/constants';
import { AuthUser } from '../utils/decorators';
import { User } from '../utils/typeorm';
import { IReactionsService } from './reactions.interface';

@Controller()
@UseGuards(JwtAuthGuard)
export class ReactionsController {
  constructor(
    @Inject(Services.REACTIONS)
    private readonly reactionsService: IReactionsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Post(Routes.REACTIONS + '/:messageId')
  async addReaction(
    @AuthUser() user: User,
    @Param('messageId') messageId: string,
    @Body() body: { emoji: string },
  ) {
    const reaction = await this.reactionsService.addReaction(
      messageId,
      user.id,
      body.emoji,
      false,
    );
    this.eventEmitter.emit(ServerEvents.REACTION_ADDED, {
      reaction,
      isGroup: false,
    });
    return reaction;
  }

  @Delete(Routes.REACTIONS + '/:messageId')
  async removeReaction(
    @AuthUser() user: User,
    @Param('messageId') messageId: string,
    @Query('emoji') emoji: string,
  ) {
    await this.reactionsService.removeReaction(
      messageId,
      user.id,
      emoji,
      false,
    );
    this.eventEmitter.emit(ServerEvents.REACTION_REMOVED, {
      messageId,
      userId: user.id,
      emoji,
      isGroup: false,
    });
    return { messageId, emoji };
  }

  @Get(Routes.REACTIONS + '/:messageId')
  @SkipThrottle()
  async getReactions(@Param('messageId') messageId: string) {
    return this.reactionsService.getReactions(messageId, false);
  }

  @Post(Routes.GROUP_REACTIONS + '/:messageId')
  async addGroupReaction(
    @AuthUser() user: User,
    @Param('id') groupId: string,
    @Param('messageId') messageId: string,
    @Body() body: { emoji: string },
  ) {
    const reaction = await this.reactionsService.addReaction(
      messageId,
      user.id,
      body.emoji,
      true,
    );
    this.eventEmitter.emit(ServerEvents.REACTION_ADDED, {
      reaction,
      isGroup: true,
      groupId,
    });
    return reaction;
  }

  @Delete(Routes.GROUP_REACTIONS + '/:messageId')
  async removeGroupReaction(
    @AuthUser() user: User,
    @Param('id') groupId: string,
    @Param('messageId') messageId: string,
    @Query('emoji') emoji: string,
  ) {
    await this.reactionsService.removeReaction(
      messageId,
      user.id,
      emoji,
      true,
    );
    this.eventEmitter.emit(ServerEvents.REACTION_REMOVED, {
      messageId,
      userId: user.id,
      emoji,
      isGroup: true,
      groupId,
    });
    return { messageId, emoji };
  }

  @Get(Routes.GROUP_REACTIONS + '/:messageId')
  @SkipThrottle()
  async getGroupReactions(
    @Param('id') groupId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.reactionsService.getReactions(messageId, true);
  }
}
