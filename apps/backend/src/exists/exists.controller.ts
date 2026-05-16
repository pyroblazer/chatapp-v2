import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
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
import type { IConversationsService } from '../conversations/conversations';
import { ConversationNotFoundException } from '../conversations/exceptions/ConversationNotFound';
import type { IUserService } from '../users/interfaces/user';
import { Routes, Services } from '../utils/constants';
import { AuthUser } from '../utils/decorators';
import type { User } from '../utils/typeorm';

@ApiTags('Conversations')
@ApiBearerAuth()
@Controller(Routes.EXISTS)
export class ExistsController {
  constructor(
    @Inject(Services.CONVERSATIONS)
    private readonly conversationsService: IConversationsService,
    @Inject(Services.USERS)
    private readonly userService: IUserService,
    private readonly events: EventEmitter2,
  ) {}

  @Get('conversations/:recipientId')
  @ApiOperation({ summary: 'Check if a conversation exists with a user' })
  @ApiParam({ name: 'recipientId', description: 'Recipient user UUID' })
  @ApiResponse({ status: 200 })
  async checkConversationExists(
    @AuthUser() user: User,
    @Param('recipientId', ParseUUIDPipe) recipientId: string,
  ) {
    const conversation = await this.conversationsService.isCreated(
      recipientId,
      user.id,
    );
    if (conversation) return conversation;
    const recipient = await this.userService.findUser({ id: recipientId });
    if (!recipient)
      throw new HttpException('Recipient Not Found', HttpStatus.NOT_FOUND);
    const newConversation = await this.conversationsService.createConversation(
      user,
      {
        username: recipient.username,
        message: 'hello',
      },
    );
    this.events.emit('conversation.create', newConversation);
    return newConversation;
  }
}
