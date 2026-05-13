import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  Column,
  Unique,
} from 'typeorm';
import type { User } from './User';
import type { Message } from './Message';

@Entity({ name: 'message_reactions' })
@Unique('UQ_MESSAGE_USER_EMOJI', ['messageId', 'userId', 'emoji'])
export class MessageReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'message_id' })
  messageId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ length: 10 })
  emoji: string;

  @ManyToOne(() => require('./Message').Message, { onDelete: 'CASCADE' })
  message: Message;

  @ManyToOne(() => require('./User').User, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
