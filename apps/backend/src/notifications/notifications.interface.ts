import { Notification } from './notification.entity';

export interface INotificationsService {
  createNotification(
    userId: string,
    type: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<Notification>;
  getNotifications(
    userId: string,
    limit?: number,
    offset?: number,
  ): Promise<Notification[]>;
  markAsRead(notificationId: string, userId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;
}
