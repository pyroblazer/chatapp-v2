import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BotConversation } from './bot-conversation.entity';

@Entity({ name: 'ai_messages' })
export class AIMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'conversation_id' })
  conversationId: string;

  @ManyToOne(() => BotConversation, { onDelete: 'CASCADE' })
  conversation: BotConversation;

  @Column()
  role: 'user' | 'assistant' | 'system';

  @Column('text')
  content: string;

  @Column({ name: 'token_count', default: 0 })
  tokenCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
