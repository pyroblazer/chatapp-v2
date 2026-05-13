import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MessageReaction,
  GroupMessageReaction,
} from '../utils/typeorm';
import { IReactionsService } from './reactions.interface';

@Injectable()
export class ReactionsService implements IReactionsService {
  constructor(
    @InjectRepository(MessageReaction)
    private readonly messageReactionRepo: Repository<MessageReaction>,
    @InjectRepository(GroupMessageReaction)
    private readonly groupMessageReactionRepo: Repository<GroupMessageReaction>,
  ) {}

  async addReaction(
    messageId: string,
    userId: string,
    emoji: string,
    isGroup: boolean,
  ): Promise<MessageReaction | GroupMessageReaction> {
    const repo = isGroup
      ? this.groupMessageReactionRepo
      : this.messageReactionRepo;

    const existing = await repo.findOne({
      where: { messageId, userId, emoji },
    });
    if (existing) return existing;

    const reaction = repo.create({ messageId, userId, emoji });
    return repo.save(reaction);
  }

  async removeReaction(
    messageId: string,
    userId: string,
    emoji: string,
    isGroup: boolean,
  ): Promise<void> {
    const repo = isGroup
      ? this.groupMessageReactionRepo
      : this.messageReactionRepo;

    await repo.delete({ messageId, userId, emoji });
  }

  async getReactions(
    messageId: string,
    isGroup: boolean,
  ): Promise<MessageReaction[] | GroupMessageReaction[]> {
    const repo = isGroup
      ? this.groupMessageReactionRepo
      : this.messageReactionRepo;

    return repo.find({
      where: { messageId },
      relations: ['user'],
    });
  }
}
