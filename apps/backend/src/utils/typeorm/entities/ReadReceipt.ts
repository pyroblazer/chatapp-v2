import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  Column,
  Unique,
} from 'typeorm';
import { User } from './User';
import { Message } from './Message';

@Entity({ name: 'read_receipts' })
@Unique('UQ_READ_RECEIPT_MESSAGE_USER', ['messageId', 'userId'])
export class ReadReceipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'message_id' })
  messageId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Message, { onDelete: 'CASCADE' })
  message: Message;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn({ name: 'read_at' })
  readAt: Date;
}
