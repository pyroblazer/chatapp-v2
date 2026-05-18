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
  Post,
  Patch,
  UseInterceptors,
  UploadedFiles,
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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { CreateMessageDto } from '../../messages/dtos/CreateMessage.dto';
import { EditMessageDto } from '../../messages/dtos/EditMessage.dto';
import { EmptyMessageException } from '../../messages/exceptions/EmptyMessage';
import { Routes, ServerEvents, Services } from '../../utils/constants';
import { AuthUser } from '../../utils/decorators';
import type { User } from '../../utils/typeorm';
import type { Attachment } from '../../utils/types';
import type { IGroupMessageService } from '../interfaces/group-messages';

@ApiTags('Groups')
@ApiBearerAuth()
@Controller(Routes.GROUP_MESSAGES)
export class GroupMessageController {
  constructor(
    @Inject(Services.GROUP_MESSAGES)
    private readonly groupMessageService: IGroupMessageService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @ApiOperation({ summary: 'Send a message in a group' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiResponse({ status: 201 })
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
  async createGroupMessage(
    @AuthUser() user: User,
    @UploadedFiles() { attachments }: { attachments: Attachment[] },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() { content, parentMessageId }: CreateMessageDto,
  ) {
    if (!attachments && !content) throw new EmptyMessageException();
    const params = {
      groupId: id,
      author: user,
      content,
      attachments,
      parentMessageId,
    };
    const response = await this.groupMessageService.createGroupMessage(params);
    this.eventEmitter.emit('group.message.create', response);
    if (parentMessageId) {
      this.eventEmitter.emit(ServerEvents.THREAD_REPLY, {
        parentMessageId,
        reply: response.message,
        group: response.group,
      });
    }
    return response.message;
  }

  @ApiOperation({ summary: 'Get all messages in a group' })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiResponse({ status: 200 })
  @Get()
  @SkipThrottle()
  async getGroupMessages(
    @AuthUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const messages = await this.groupMessageService.getGroupMessages(id);
    return { id, messages };
  }

  @ApiOperation({ summary: 'Delete a group message' })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiParam({ name: 'messageId', description: 'Message UUID' })
  @ApiResponse({ status: 200 })
  @Delete(':messageId')
  @SkipThrottle()
  async deleteGroupMessage(
    @AuthUser() user: User,
    @Param('id', ParseUUIDPipe) groupId: string,
    @Param('messageId', ParseUUIDPipe) messageId: string,
  ) {
    await this.groupMessageService.deleteGroupMessage({
      userId: user.id,
      groupId,
      messageId,
    });
    this.eventEmitter.emit('group.message.delete', {
      userId: user.id,
      messageId,
      groupId,
    });
    return { groupId, messageId };
  }

  @ApiOperation({ summary: 'Edit a group message' })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiParam({ name: 'messageId', description: 'Message UUID' })
  @ApiResponse({ status: 200 })
  @Patch(':messageId')
  @SkipThrottle()
  async editGroupMessage(
    @AuthUser() { id: userId }: User,
    @Param('id', ParseUUIDPipe) groupId: string,
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @Body() { content }: EditMessageDto,
  ) {
    const params = { userId, content, groupId, messageId };
    const message = await this.groupMessageService.editGroupMessage(params);
    this.eventEmitter.emit('group.message.update', message);
    return message;
  }

  @ApiOperation({ summary: 'Get thread replies for a group message' })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiParam({ name: 'messageId', description: 'Message UUID' })
  @ApiResponse({ status: 200 })
  @Get(':messageId/thread')
  @SkipThrottle()
  async getGroupThreadReplies(
    @AuthUser() user: User,
    @Param('id', ParseUUIDPipe) groupId: string,
    @Param('messageId', ParseUUIDPipe) messageId: string,
  ) {
    const replies = await this.groupMessageService.getGroupThreadReplies(
      messageId,
    );
    return { messageId, replies };
  }
}
