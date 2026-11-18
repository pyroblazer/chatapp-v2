import type { Message } from '../utils/typeorm';
import type {
  CreateMessageParams,
  CreateMessageResponse,
  DeleteMessageParams,
  EditMessageParams,
} from '../utils/types';

export interface IMessageService {
  createMessage(params: CreateMessageParams): Promise<CreateMessageResponse>;
  getMessages(id: string, cursor?: string, limit?: number, userId?: string): Promise<Message[]>;
  deleteMessage(params: DeleteMessageParams);
  editMessage(params: EditMessageParams): Promise<Message>;
  getThreadReplies(messageId: string, userId?: string, conversationId?: string): Promise<Message[]>;
  assertParticipant(userId: string, conversationId: string): Promise<void>;
  pinMessage(userId: string, conversationId: string, messageId: string): Promise<Message>;
  unpinMessage(userId: string, conversationId: string, messageId: string): Promise<Message>;
  getPinnedMessages(userId: string, conversationId: string): Promise<Message[]>;
  searchMessages(userId: string, conversationId: string, query: string): Promise<Message[]>;
}
