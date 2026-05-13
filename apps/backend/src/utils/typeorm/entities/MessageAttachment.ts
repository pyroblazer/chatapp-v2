import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { Message } from './Message';

@Entity({ name: 'message_attachments' })
export class MessageAttachment {
  @PrimaryGeneratedColumn('uuid')
  key: string;

  @ManyToOne(
    () => require('./Message').Message,
    (message: any) => message.attachments,
    {
      onDelete: 'CASCADE',
    },
  )
  message: Message;
}
