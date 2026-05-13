import { MessageReaction, GroupMessageReaction } from '../utils/typeorm';

export interface IReactionsService {
  addReaction(
    messageId: string,
    userId: string,
    emoji: string,
    isGroup: boolean,
  ): Promise<MessageReaction | GroupMessageReaction>;
  removeReaction(
    messageId: string,
    userId: string,
    emoji: string,
    isGroup: boolean,
  ): Promise<void>;
  getReactions(
    messageId: string,
    isGroup: boolean,
  ): Promise<MessageReaction[] | GroupMessageReaction[]>;
}
