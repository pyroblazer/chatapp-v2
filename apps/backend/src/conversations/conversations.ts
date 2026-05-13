import { Conversation, User } from '../utils/typeorm';
import {
  AccessParams,
  CreateConversationParams,
  GetConversationMessagesParams,
  UpdateConversationParams,
} from '../utils/types';

export interface IConversationsService {
  createConversation(
    user: User,
    conversationParams: CreateConversationParams,
  ): Promise<Conversation>;
  getConversations(id: string): Promise<Conversation[]>;
  findById(id: string): Promise<Conversation | undefined>;
  hasAccess(params: AccessParams): Promise<boolean>;
  isCreated(
    userId: string,
    recipientId: string,
  ): Promise<Conversation | undefined>;
  save(conversation: Conversation): Promise<Conversation>;
  getMessages(params: GetConversationMessagesParams): Promise<Conversation>;
  update(params: UpdateConversationParams);
}
