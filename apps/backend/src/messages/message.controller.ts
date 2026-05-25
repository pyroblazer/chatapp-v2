import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { tmpdir } from 'os';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { RedisCacheService } from '../redis/redis.cache.service';
import { Routes, ServerEvents, Services } from '../utils/constants';
import { AuthUser } from '../utils/decorators';
import type { Attachment } from '../utils/types';
import type { User } from '../utils/typeorm';
import { CreateMessageDto } from './dtos/CreateMessage.dto';
import { EditMessageDto } from './dtos/EditMessage.dto';
import { EmptyMessageException } from './exceptions/EmptyMessage';
import type { IMessageService } from './message';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller(Routes.MESSAGES)
export class MessageController {
  constructor(
    @Inject(Services.MESSAGES) private readonly messageService: IMessageService,
    private eventEmitter: EventEmitter2,
    private readonly cache: RedisCacheService,
  ) {}

  @ApiOperation({ summary: 'Send a message in a conversation' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 400 })
  @Throttle(parseInt(process.env.MSG_THROTTLE_LIMIT || '5', 10), parseInt(process.env.MSG_THROTTLE_TTL || '10', 10))
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'attachments', maxCount: 5 }],
      {
        storage: diskStorage({
          destination: (_req, _file, cb) => cb(null, tmpdir()),
          filename: (_req, file, cb) =>
            cb(null, `chatapp-${Date.now()}-${file.originalname}`),
        }),
      },
    ),
  )
  @Post()
  async createMessage(
    @AuthUser() user: User,
    @UploadedFiles() { attachments }: { attachments: Attachment[] },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() { content, parentMessageId }: CreateMessageDto,
  ) {
    if (!attachments && !content) throw new EmptyMessageException();
    const params = { user, id, content, attachments, parentMessageId };
    const response = await this.messageService.createMessage(params);
    const { creator, recipient } = response.conversation;
    await Promise.all([
      this.cache.invalidateConversations(creator.id),
      this.cache.invalidateConversations(recipient.id),
    ]);
    this.eventEmitter.emit('message.create', response);
    if (parentMessageId) {
      this.eventEmitter.emit(ServerEvents.THREAD_REPLY, {
        parentMessageId,
        reply: response.message,
        conversation: response.conversation,
      });
    }
    return response.message;
  }

  @ApiOperation({ summary: 'Get all messages in a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200 })
  @Get()
  @SkipThrottle()
  async getMessagesFromConversation(
    @AuthUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    const messages = await this.messageService.getMessages(id, cursor, limit || 50);
    return { id, messages };
  }

  @ApiOperation({ summary: 'Delete a message' })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  @ApiParam({ name: 'messageId', description: 'Message UUID' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403 })
  @Delete(':messageId')
  async deleteMessageFromConversation(
    @AuthUser() user: User,
    @Param('id', ParseUUIDPipe) conversationId: string,
    @Param('messageId', ParseUUIDPipe) messageId: string,
  ) {
    const params = { userId: user.id, conversationId, messageId };
    await this.messageService.deleteMessage(params);
    this.eventEmitter.emit('message.delete', params);
    return { conversationId, messageId };
  }
  // api/conversations/:conversationId/messages/:messageId
  @ApiOperation({ summary: 'Edit a message' })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  @ApiParam({ name: 'messageId', description: 'Message UUID' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403 })
  @Patch(':messageId')
  async editMessage(
    @AuthUser() { id: userId }: User,
    @Param('id', ParseUUIDPipe) conversationId: string,
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @Body() { content }: EditMessageDto,
  ) {
    const params = { userId, content, conversationId, messageId };
    const message = await this.messageService.editMessage(params);
    this.eventEmitter.emit('message.update', message);
    return message;
  }

  @ApiOperation({ summary: 'Get thread replies for a message' })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  @ApiParam({ name: 'messageId', description: 'Message UUID' })
  @ApiResponse({ status: 200 })
  @Get(':messageId/thread')
  @SkipThrottle()
  async getThreadReplies(
    @AuthUser() user: User,
    @Param('id', ParseUUIDPipe) conversationId: string,
    @Param('messageId', ParseUUIDPipe) messageId: string,
  ) {
    const replies = await this.messageService.getThreadReplies(messageId);
    return { messageId, replies };
  }
}
