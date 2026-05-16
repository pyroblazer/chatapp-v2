import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageReaction, GroupMessageReaction } from '../utils/typeorm';
import type { IReactionsService } from './reactions.interface';

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
    if (isGroup) {
      const existing = await this.groupMessageReactionRepo.findOne({
        where: { messageId, userId, emoji },
      });
      if (existing) return existing;
      const reaction = this.groupMessageReactionRepo.create({ messageId, userId, emoji });
      return this.groupMessageReactionRepo.save(reaction);
    }

    const existing = await this.messageReactionRepo.findOne({
      where: { messageId, userId, emoji },
    });
    if (existing) return existing;
    const reaction = this.messageReactionRepo.create({ messageId, userId, emoji });
    return this.messageReactionRepo.save(reaction);
  }

  async removeReaction(
    messageId: string,
    userId: string,
    emoji: string,
    isGroup: boolean,
  ): Promise<void> {
    if (isGroup) {
      await this.groupMessageReactionRepo.delete({ messageId, userId, emoji });
    } else {
      await this.messageReactionRepo.delete({ messageId, userId, emoji });
    }
  }

  async getReactions(
    messageId: string,
    isGroup: boolean,
  ): Promise<MessageReaction[] | GroupMessageReaction[]> {
    if (isGroup) {
      return this.groupMessageReactionRepo.find({
        where: { messageId },
        relations: ['user'],
      });
    }
    return this.messageReactionRepo.find({
      where: { messageId },
      relations: ['user'],
    });
  }
}
