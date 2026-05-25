import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { instanceToPlain } from 'class-transformer';
import { Repository } from 'typeorm';
import type { IConversationsService } from '../conversations/conversations';
import { ConversationNotFoundException } from '../conversations/exceptions/ConversationNotFound';

import type { IFriendsService } from '../friends/friends';
import type { IMessageAttachmentsService } from '../message-attachments/message-attachments';
import { buildFindMessageParams } from '../utils/builders';
import { Services } from '../utils/constants';
import { Conversation, Message } from '../utils/typeorm';
import type {
  CreateMessageParams,
  DeleteMessageParams,
  EditMessageParams,
} from '../utils/types';
import { CannotCreateMessageException } from './exceptions/CannotCreateMessage';
import { CannotDeleteMessage } from './exceptions/CannotDeleteMessage';
import type { IMessageService } from './message';

@Injectable()
export class MessageService implements IMessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @Inject(Services.CONVERSATIONS)
    private readonly conversationService: IConversationsService,
    @Inject(Services.MESSAGE_ATTACHMENTS)
    private readonly messageAttachmentsService: IMessageAttachmentsService,
    @Inject(Services.FRIENDS_SERVICE)
    private readonly friendsService: IFriendsService,
  ) {}
  async createMessage(params: CreateMessageParams) {
    const { user, content, id } = params;
    const conversation = await this.conversationService.findById(id);
    if (!conversation) throw new ConversationNotFoundException();
    const { creator, recipient } = conversation;
    const isFriends = await this.friendsService.isFriends(
      creator.id,
      recipient.id,
    );
    if (!isFriends)
      throw new CannotCreateMessageException(
        'You must be friends to send messages',
      );
    if (creator.id !== user.id && recipient.id !== user.id)
      throw new CannotCreateMessageException();

    const { parentMessageId } = params;

    const message = this.messageRepository.create({
      content,
      conversation,
      author: instanceToPlain(user),
      attachments: params.attachments
        ? await this.messageAttachmentsService.create(params.attachments)
        : [],
      parentMessageId: parentMessageId || null,
    });
    const savedMessage = await this.messageRepository.save(message);

    if (parentMessageId) {
      await this.messageRepository.increment(
        { id: parentMessageId },
        'threadReplyCount',
        1,
      );
    }

    conversation.lastMessageSent = savedMessage;
    const updated = await this.conversationService.save(conversation);
    return { message: savedMessage, conversation: updated };
  }

  async getMessages(conversationId: string, cursor?: string, limit = 50): Promise<Message[]> {
    const qb = this.messageRepository.createQueryBuilder('message')
      .leftJoinAndSelect('message.author', 'author')
      .leftJoinAndSelect('author.profile', 'profile')
      .leftJoinAndSelect('message.attachments', 'attachments')
      .where('message.conversationId = :conversationId', { conversationId })
      .orderBy('message.createdAt', 'DESC')
      .take(limit + 1);

    if (cursor) {
      const cursorMsg = await this.messageRepository.findOne({ where: { id: cursor } });
      if (cursorMsg) {
        qb.andWhere('message.createdAt < :cursorDate', { cursorDate: cursorMsg.createdAt });
      }
    }

    const messages = await qb.getMany();
    return messages.slice(0, limit);
  }

  async deleteMessage(params: DeleteMessageParams) {
    const { conversationId } = params;
    const msgParams = { id: conversationId, limit: 5 };
    const conversation = await this.conversationService.getMessages(msgParams);
    if (!conversation) throw new ConversationNotFoundException();
    const findMessageParams = buildFindMessageParams(params);
    const message = await this.messageRepository.findOne(findMessageParams);
    if (!message) throw new CannotDeleteMessage();
    if (conversation.lastMessageSent.id !== message.id)
      return this.messageRepository.delete({ id: message.id });
    return this.deleteLastMessage(conversation, message);
  }

  async deleteLastMessage(conversation: Conversation, message: Message) {
    const size = conversation.messages.length;
    const SECOND_MESSAGE_INDEX = 1;
    if (size <= 1) {
      await this.conversationService.update({
        id: conversation.id,
        lastMessageSent: null,
      });
      return this.messageRepository.delete({ id: message.id });
    } else {
      const newLastMessage = conversation.messages[SECOND_MESSAGE_INDEX];
      await this.conversationService.update({
        id: conversation.id,
        lastMessageSent: newLastMessage,
      });
      return this.messageRepository.delete({ id: message.id });
    }
  }

  async editMessage(params: EditMessageParams) {
    const messageDB = await this.messageRepository.findOne({
      where: {
        id: params.messageId,
        author: { id: params.userId },
      },
      relations: [
        'conversation',
        'conversation.creator',
        'conversation.recipient',
        'author',
        'author.profile',
      ],
    });
    if (!messageDB)
      throw new HttpException(
        'Cannot edit message: insufficient permissions',
        HttpStatus.FORBIDDEN,
      );
    messageDB.content = params.content;
    return this.messageRepository.save(messageDB);
  }

  async getThreadReplies(messageId: string): Promise<Message[]> {
    return this.messageRepository.find({
      where: { parentMessageId: messageId },
      relations: ['author', 'author.profile', 'attachments'],
      order: { createdAt: 'ASC' },
    });
  }
}
