import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SkipThrottle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Routes, ServerEvents, Services } from '../utils/constants';
import { AuthUser } from '../utils/decorators';
import type { User } from '../utils/typeorm';
import type { IReactionsService } from './reactions.interface';
import { AddReactionDto } from './dtos/AddReaction.dto';

@ApiTags('Reactions')
@ApiBearerAuth()
@Controller()
export class ReactionsController {
  constructor(
    @Inject(Services.REACTIONS)
    private readonly reactionsService: IReactionsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Post(Routes.REACTIONS + '/:messageId')
  @ApiOperation({ summary: 'Add a reaction to a message' })
  @ApiParam({ name: 'messageId', description: 'Message UUID' })
  async addReaction(
    @AuthUser() user: User,
    @Param('messageId') messageId: string,
    @Body() body: AddReactionDto,
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
  @ApiOperation({ summary: 'Remove a reaction from a message' })
  @ApiParam({ name: 'messageId', description: 'Message UUID' })
  @ApiQuery({ name: 'emoji', description: 'Emoji to remove' })
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
  @ApiOperation({ summary: 'Get reactions for a message' })
  @ApiParam({ name: 'messageId', description: 'Message UUID' })
  async getReactions(@Param('messageId') messageId: string) {
    return this.reactionsService.getReactions(messageId, false);
  }

  @Post(Routes.GROUP_REACTIONS + '/:messageId')
  @ApiOperation({ summary: 'Add a reaction to a group message' })
  @ApiParam({ name: 'messageId', description: 'Message UUID' })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  async addGroupReaction(
    @AuthUser() user: User,
    @Param('id') groupId: string,
    @Param('messageId') messageId: string,
    @Body() body: AddReactionDto,
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
  @ApiOperation({ summary: 'Remove a reaction from a group message' })
  @ApiParam({ name: 'messageId', description: 'Message UUID' })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiQuery({ name: 'emoji', description: 'Emoji to remove' })
  async removeGroupReaction(
    @AuthUser() user: User,
    @Param('id') groupId: string,
    @Param('messageId') messageId: string,
    @Query('emoji') emoji: string,
  ) {
    await this.reactionsService.removeReaction(messageId, user.id, emoji, true);
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
  @ApiOperation({ summary: 'Get reactions for a group message' })
  @ApiParam({ name: 'messageId', description: 'Message UUID' })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  async getGroupReactions(
    @Param('id') groupId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.reactionsService.getReactions(messageId, true);
  }
}
