import type { Report } from './report.entity';
import type { User } from '../utils/typeorm';

export interface IAdminService {
  listUsers(page?: number, limit?: number): Promise<[User[], number]>;
  banUser(userId: string): Promise<void>;
  unbanUser(userId: string): Promise<void>;
  changeUserRole(
    userId: string,
    role: 'USER' | 'MODERATOR' | 'ADMIN',
  ): Promise<void>;
  deleteMessageAsAdmin(messageId: string, isGroup: boolean): Promise<void>;
  createReport(
    reporterId: string,
    reportedUserId: string | null,
    messageId: string | null,
    reason: string,
    description?: string,
  ): Promise<Report>;
  listReports(
    status?: string,
    page?: number,
    limit?: number,
  ): Promise<[Report[], number]>;
  updateReportStatus(
    reportId: string,
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed',
  ): Promise<void>;
}
