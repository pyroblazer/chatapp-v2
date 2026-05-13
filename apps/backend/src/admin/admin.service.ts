import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Message, GroupMessage } from '../utils/typeorm';
import { Report } from './report.entity';
import type { IAdminService } from './admin.interface';

@Injectable()
export class AdminService implements IAdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(GroupMessage)
    private readonly groupMessageRepo: Repository<GroupMessage>,
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
  ) {}

  async listUsers(page = 1, limit = 20): Promise<[User[], number]> {
    return this.userRepo.findAndCount({
      select: ['id', 'username', 'email', 'firstName', 'lastName', 'active'],
      skip: (page - 1) * limit,
      take: limit,
      order: { username: 'ASC' },
    });
  }

  async banUser(userId: string): Promise<void> {
    await this.userRepo.update({ id: userId }, { active: false });
  }

  async unbanUser(userId: string): Promise<void> {
    await this.userRepo.update({ id: userId }, { active: true });
  }

  async changeUserRole(
    userId: string,
    role: 'USER' | 'MODERATOR' | 'ADMIN',
  ): Promise<void> {
    await this.userRepo.update({ id: userId }, { role });
  }

  async deleteMessageAsAdmin(
    messageId: string,
    isGroup: boolean,
  ): Promise<void> {
    if (isGroup) {
      await this.groupMessageRepo.delete({ id: messageId });
    } else {
      await this.messageRepo.delete({ id: messageId });
    }
  }

  async createReport(
    reporterId: string,
    reportedUserId: string | null,
    messageId: string | null,
    reason: string,
    description?: string,
  ): Promise<Report> {
    const report = this.reportRepo.create({
      reporterId,
      reportedUserId,
      messageId,
      reason,
      description,
    });
    return this.reportRepo.save(report);
  }

  async listReports(
    status?: string,
    page = 1,
    limit = 20,
  ): Promise<[Report[], number]> {
    const where: any = {};
    if (status) {
      where.status = status;
    }
    return this.reportRepo.findAndCount({
      where,
      relations: ['reporter', 'reportedUser'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  async updateReportStatus(
    reportId: string,
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed',
  ): Promise<void> {
    const report = await this.reportRepo.findOne({ where: { id: reportId } });
    if (!report) {
      throw new HttpException('Report not found', HttpStatus.NOT_FOUND);
    }
    await this.reportRepo.update({ id: reportId }, { status });
  }
}
