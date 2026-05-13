import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseMessage } from './BaseMessage';
import type { Conversation } from './Conversation';
import type { MessageAttachment } from './MessageAttachment';
import type { MessageReaction } from './MessageReaction';
import type { ReadReceipt } from './ReadReceipt';

@Entity({ name: 'messages' })
export class Message extends BaseMessage {
  @ManyToOne(
    () => require('./Conversation').Conversation,
    (conversation: any) => conversation.messages,
  )
  conversation: Conversation;

  @OneToMany(
    () => require('./MessageAttachment').MessageAttachment,
    (attachment: any) => attachment.message,
  )
  attachments: MessageAttachment[];

  @Column({ name: 'parent_message_id', nullable: true })
  parentMessageId: string;

  @ManyToOne(() => Message, { nullable: true })
  parentMessage: Message;

  @OneToMany(() => Message, (message: any) => message.parentMessage)
  replies: Message[];

  @Column({ name: 'thread_reply_count', default: 0 })
  threadReplyCount: number;

  @OneToMany(
    () => require('./MessageReaction').MessageReaction,
    (reaction: any) => reaction.message,
  )
  reactions: MessageReaction[];

  @OneToMany(
    () => require('./ReadReceipt').ReadReceipt,
    (receipt: any) => receipt.message,
  )
  readReceipts: ReadReceipt[];
}
