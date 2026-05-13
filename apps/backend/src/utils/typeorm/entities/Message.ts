import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseMessage } from './BaseMessage';
import { Conversation } from './Conversation';
import { MessageAttachment } from './MessageAttachment';
import { MessageReaction } from './MessageReaction';
import { ReadReceipt } from './ReadReceipt';

@Entity({ name: 'messages' })
export class Message extends BaseMessage {
  @ManyToOne(() => Conversation, (conversation) => conversation.messages)
  conversation: Conversation;

  @OneToMany(() => MessageAttachment, (attachment) => attachment.message)
  attachments: MessageAttachment[];

  @Column({ name: 'parent_message_id', nullable: true })
  parentMessageId: string;

  @ManyToOne(() => Message, { nullable: true })
  parentMessage: Message;

  @OneToMany(() => Message, (message) => message.parentMessage)
  replies: Message[];

  @Column({ name: 'thread_reply_count', default: 0 })
  threadReplyCount: number;

  @OneToMany(() => MessageReaction, (reaction) => reaction.message)
  reactions: MessageReaction[];

  @OneToMany(() => ReadReceipt, (receipt) => receipt.message)
  readReceipts: ReadReceipt[];
}
