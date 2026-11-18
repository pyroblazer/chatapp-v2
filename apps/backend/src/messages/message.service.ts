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

export const MAX_PINNED_MESSAGES = 10;
export const MAX_SEARCH_LENGTH = 100;

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

  async getMessages(conversationId: string, cursor?: string, limit = 50, userId?: string): Promise<Message[]> {
    if (userId) await this.assertParticipant(userId, conversationId);
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

  async getThreadReplies(messageId: string, userId?: string, conversationId?: string): Promise<Message[]> {
    if (userId && conversationId) {
      await this.assertParticipant(userId, conversationId);
      // The parent must belong to the conversation the caller is allowed to read
      const parent = await this.messageRepository.findOne({
        where: { id: messageId, conversation: { id: conversationId } },
      });
      if (!parent) throw new HttpException('Message not found', HttpStatus.NOT_FOUND);
    }
    return this.messageRepository.find({
      where: { parentMessageId: messageId },
      relations: ['author', 'author.profile', 'attachments'],
      order: { createdAt: 'ASC' },
    });
  }

  /** Throws 403 unless the user is one of the two people in the conversation. */
  async assertParticipant(userId: string, conversationId: string): Promise<void> {
    const conversation = await this.conversationService.findById(conversationId);
    if (!conversation) throw new ConversationNotFoundException();
    if (conversation.creator.id !== userId && conversation.recipient.id !== userId) {
      throw new HttpException('Not a participant of this conversation', HttpStatus.FORBIDDEN);
    }
  }

  private async findInConversation(conversationId: string, messageId: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId, conversation: { id: conversationId } },
      relations: ['author', 'author.profile'],
    });
    if (!message) throw new HttpException('Message not found', HttpStatus.NOT_FOUND);
    return message;
  }

  async pinMessage(userId: string, conversationId: string, messageId: string): Promise<Message> {
    await this.assertParticipant(userId, conversationId);
    const message = await this.findInConversation(conversationId, messageId);
    if (message.pinnedAt) return message; // already pinned: idempotent

    const pinned = await this.messageRepository
      .createQueryBuilder('message')
      .where('message.conversationId = :conversationId', { conversationId })
      .andWhere('message.pinnedAt IS NOT NULL')
      .getCount();
    if (pinned >= MAX_PINNED_MESSAGES) {
      throw new HttpException(
        `A conversation can have at most ${MAX_PINNED_MESSAGES} pinned messages`,
        HttpStatus.BAD_REQUEST,
      );
    }

    message.pinnedAt = new Date();
    return this.messageRepository.save(message);
  }

  async unpinMessage(userId: string, conversationId: string, messageId: string): Promise<Message> {
    await this.assertParticipant(userId, conversationId);
    const message = await this.findInConversation(conversationId, messageId);
    message.pinnedAt = null;
    return this.messageRepository.save(message);
  }

  async getPinnedMessages(userId: string, conversationId: string): Promise<Message[]> {
    await this.assertParticipant(userId, conversationId);
    return this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.author', 'author')
      .leftJoinAndSelect('author.profile', 'profile')
      .where('message.conversationId = :conversationId', { conversationId })
      .andWhere('message.pinnedAt IS NOT NULL')
      .orderBy('message.pinnedAt', 'DESC')
      .getMany();
  }

  /**
   * Full-text search (Postgres tsvector) within one conversation. The query is
   * passed through plainto_tsquery, so user input is never interpreted as
   * tsquery syntax, and is bound as a parameter.
   */
  async searchMessages(userId: string, conversationId: string, query: string): Promise<Message[]> {
    await this.assertParticipant(userId, conversationId);
    const q = (query ?? '').trim().slice(0, MAX_SEARCH_LENGTH);
    if (!q) return [];

    return this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.author', 'author')
      .leftJoinAndSelect('author.profile', 'profile')
      .where('message.conversationId = :conversationId', { conversationId })
      .andWhere("to_tsvector('simple', message.content) @@ plainto_tsquery('simple', :q)", { q })
      .orderBy('message.createdAt', 'DESC')
      .take(50)
      .getMany();
  }
}
