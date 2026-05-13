import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  Column,
  Unique,
} from 'typeorm';
import { User } from './User';
import { GroupMessage } from './GroupMessage';

@Entity({ name: 'group_message_reactions' })
@Unique('UQ_GROUP_MESSAGE_USER_EMOJI', ['messageId', 'userId', 'emoji'])
export class GroupMessageReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'message_id' })
  messageId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ length: 10 })
  emoji: string;

  @ManyToOne(() => GroupMessage, { onDelete: 'CASCADE' })
  message: GroupMessage;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
