import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { GroupMessage } from './GroupMessage';

@Entity({ name: 'group_message_attachments' })
export class GroupMessageAttachment {
  @PrimaryGeneratedColumn('uuid')
  key: string;

  @ManyToOne(() => require('./GroupMessage').GroupMessage, (message: any) => message.attachments, {
    onDelete: 'CASCADE',
  })
  message: GroupMessage;
}
