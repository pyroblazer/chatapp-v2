import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  Column,
  Unique,
  JoinColumn,
} from 'typeorm';
import type { User } from './User';
import type { Message } from './Message';

@Entity({ name: 'read_receipts' })
@Unique('UQ_READ_RECEIPT_MESSAGE_USER', ['messageId', 'userId'])
export class ReadReceipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'message_id', type: 'uuid' })
  messageId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => require('./Message').Message, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message: Message;

  @ManyToOne(() => require('./User').User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'read_at' })
  readAt: Date;
}
