import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Message,
  GroupMessage,
  User,
  Group,
  Conversation,
} from '../utils/typeorm';
import type { ISearchService } from './search.interface';

@Injectable()
export class SearchService implements ISearchService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(GroupMessage)
    private readonly groupMessageRepo: Repository<GroupMessage>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
  ) {}

  async searchMessages(
    query: string,
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<any[]> {
    const sanitizedQuery = query.replace(/\s+/g, ' & ');

    const userConversations = await this.conversationRepo
      .createQueryBuilder('c')
      .select('c.id')
      .where('c.creator_id = :userId OR c.recipient_id = :userId', { userId })
      .getRawMany();

    const conversationIds = userConversations.map((c) => c.c_id);
    if (conversationIds.length === 0) return [];

    const dmMessages = await this.messageRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.author', 'author')
      .leftJoinAndSelect('author.profile', 'profile')
      .where("to_tsvector('english', m.content) @@ to_tsquery(:query)", {
        query: sanitizedQuery,
      })
      .andWhere('m.conversation_id IN (:...conversationIds)', {
        conversationIds,
      })
      .orderBy('m.created_at', 'DESC')
      .limit(limit)
      .offset(offset)
      .getMany();

    const userGroups = await this.groupRepo
      .createQueryBuilder('g')
      .innerJoin('g.users', 'u', 'u.id = :userId', { userId })
      .select('g.id')
      .getRawMany();

    const groupIds = userGroups.map((g) => g.g_id);

    let groupMessages: any[] = [];
    if (groupIds.length > 0) {
      groupMessages = await this.groupMessageRepo
        .createQueryBuilder('gm')
        .leftJoinAndSelect('gm.author', 'author')
        .leftJoinAndSelect('author.profile', 'profile')
        .where("to_tsvector('english', gm.content) @@ to_tsquery(:query)", {
          query: sanitizedQuery,
        })
        .andWhere('gm.group_id IN (:...groupIds)', { groupIds })
        .orderBy('gm.created_at', 'DESC')
        .limit(limit)
        .offset(offset)
        .getMany();
    }

    const results = [
      ...dmMessages.map((m) => ({ ...m, type: 'dm' })),
      ...groupMessages.map((m) => ({ ...m, type: 'group' })),
    ];

    results.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return results.slice(0, limit);
  }

  async searchUsers(query: string): Promise<any[]> {
    const pattern = `%${query}%`;
    return this.userRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.profile', 'profile')
      .where('u.username ILIKE :pattern', { pattern })
      .orWhere('u.first_name ILIKE :pattern', { pattern })
      .orWhere('u.last_name ILIKE :pattern', { pattern })
      .limit(20)
      .getMany();
  }

  async searchGroups(query: string, userId: string): Promise<any[]> {
    const pattern = `%${query}%`;
    return this.groupRepo
      .createQueryBuilder('g')
      .innerJoin('g.users', 'u', 'u.id = :userId', { userId })
      .where('g.title ILIKE :pattern', { pattern })
      .limit(20)
      .getMany();
  }
}
