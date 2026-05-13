import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseMessage } from './BaseMessage';
import { Group } from './Group';
import { GroupMessageAttachment } from './GroupMessageAttachment';
import { GroupMessageReaction } from './GroupMessageReaction';

@Entity({ name: 'group_messages' })
export class GroupMessage extends BaseMessage {
  @ManyToOne(() => Group, (group) => group.messages)
  group: Group;

  @OneToMany(() => GroupMessageAttachment, (attachment) => attachment.message)
  attachments: GroupMessageAttachment[];

  @Column({ name: 'parent_message_id', nullable: true })
  parentMessageId: string;

  @ManyToOne(() => GroupMessage, { nullable: true })
  parentMessage: GroupMessage;

  @OneToMany(() => GroupMessage, (message) => message.parentMessage)
  replies: GroupMessage[];

  @Column({ name: 'thread_reply_count', default: 0 })
  threadReplyCount: number;

  @OneToMany(() => GroupMessageReaction, (reaction) => reaction.message)
  reactions: GroupMessageReaction[];
}
