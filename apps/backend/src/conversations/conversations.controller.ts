import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SkipThrottle } from '@nestjs/throttler';
import { Routes, Services } from '../utils/constants';
import { AuthUser } from '../utils/decorators';
import type { User } from '../utils/typeorm';
import type { IUserService } from '../users/interfaces/user';
import type { IConversationsService } from './conversations';
import { CreateConversationDto } from './dtos/CreateConversation.dto';
import { ConversationNotFoundException } from './exceptions/ConversationNotFound';

@ApiTags('Conversations')
@ApiBearerAuth()
@SkipThrottle()
@Controller(Routes.CONVERSATIONS)
export class ConversationsController {
  constructor(
    @Inject(Services.CONVERSATIONS)
    private readonly conversationsService: IConversationsService,
    private readonly events: EventEmitter2,
    @Inject(Services.USERS)
    private readonly userService: IUserService,
  ) {}

  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 400 })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createConversation(
    @AuthUser() user: User,
    @Body() createConversationPayload: CreateConversationDto,
  ) {
    const fullUser = await this.userService.findUser({ id: user.id });
    if (!fullUser) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    const conversation = await this.conversationsService.createConversation(
      fullUser,
      createConversationPayload,
    );
    this.events.emit('conversation.create', conversation);
    return conversation;
  }

  @ApiOperation({ summary: 'Get all conversations for the authenticated user' })
  @ApiResponse({ status: 200 })
  @Get()
  async getConversations(@AuthUser() { id }: User) {
    return this.conversationsService.getConversations(id);
  }

  @ApiOperation({ summary: 'Get a conversation by ID' })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  @Get(':id')
  async getConversationById(@Param('id', ParseUUIDPipe) id: string) {
    const conversation = await this.conversationsService.findById(id);
    if (!conversation) throw new ConversationNotFoundException();
    return conversation;
  }
}
