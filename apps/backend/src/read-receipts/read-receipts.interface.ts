export interface IReadReceiptsService {
  markAsRead(messageId: string, userId: string): Promise<void>;
  markConversationAsRead(conversationId: string, userId: string): Promise<void>;
  getUnreadCount(conversationId: string, userId: string): Promise<number>;
}
