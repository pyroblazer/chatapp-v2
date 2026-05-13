import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseMessage } from './BaseMessage';
import type { Group } from './Group';
import type { GroupMessageAttachment } from './GroupMessageAttachment';
import type { GroupMessageReaction } from './GroupMessageReaction';

@Entity({ name: 'group_messages' })
export class GroupMessage extends BaseMessage {
  @ManyToOne(() => require('./Group').Group, (group: any) => group.messages)
  group: Group;

  @OneToMany(
    () => require('./GroupMessageAttachment').GroupMessageAttachment,
    (attachment: any) => attachment.message,
  )
  attachments: GroupMessageAttachment[];

  @Column({ name: 'parent_message_id', nullable: true })
  parentMessageId: string;

  @ManyToOne(() => GroupMessage, { nullable: true })
  parentMessage: GroupMessage;

  @OneToMany(() => GroupMessage, (message: any) => message.parentMessage)
  replies: GroupMessage[];

  @Column({ name: 'thread_reply_count', default: 0 })
  threadReplyCount: number;

  @OneToMany(
    () => require('./GroupMessageReaction').GroupMessageReaction,
    (reaction: any) => reaction.message,
  )
  reactions: GroupMessageReaction[];
}
