import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, ReadReceipt } from '../utils/typeorm';
import type { IReadReceiptsService } from './read-receipts.interface';

@Injectable()
export class ReadReceiptsService implements IReadReceiptsService {
  constructor(
    @InjectRepository(ReadReceipt)
    private readonly readReceiptRepo: Repository<ReadReceipt>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {}

  async markAsRead(messageId: string, userId: string): Promise<void> {
    const existing = await this.readReceiptRepo.findOne({
      where: { messageId, userId },
    });
    if (existing) return;

    const receipt = this.readReceiptRepo.create({ messageId, userId });
    await this.readReceiptRepo.save(receipt);
  }

  async markConversationAsRead(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    const messages = await this.messageRepo
      .createQueryBuilder('m')
      .leftJoin(
        'read_receipts',
        'rr',
        'rr.message_id = m.id AND rr.user_id = :userId',
        { userId },
      )
      .where('m.conversation_id = :conversationId', { conversationId })
      .andWhere('rr.id IS NULL')
      .getMany();

    if (messages.length === 0) return;

    const receipts = messages.map((message) =>
      this.readReceiptRepo.create({ messageId: message.id, userId }),
    );
    await this.readReceiptRepo.save(receipts);
  }

  async getUnreadCount(
    conversationId: string,
    userId: string,
  ): Promise<number> {
    const count = await this.messageRepo
      .createQueryBuilder('m')
      .leftJoin(
        'read_receipts',
        'rr',
        'rr.message_id = m.id AND rr.user_id = :userId',
        { userId },
      )
      .where('m.conversation_id = :conversationId', { conversationId })
      .andWhere('rr.id IS NULL')
      .getCount();

    return count;
  }
}
