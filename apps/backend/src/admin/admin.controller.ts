import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { Routes, Services } from '../utils/constants';
import { AuthUser } from '../utils/decorators';
import type { User } from '../utils/typeorm';
import type { IAdminService } from './admin.interface';
import type { IAuditService } from '../audit/audit.interface';

@Controller(Routes.ADMIN)
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    @Inject(Services.ADMIN)
    private readonly adminService: IAdminService,
    @Inject(Services.AUDIT)
    private readonly auditService: IAuditService,
  ) {}

  @Get('users')
  @SkipThrottle()
  async listUsers(
    @AuthUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const [users, total] = await this.adminService.listUsers(
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
    return { users, total };
  }

  @Patch('users/:id/ban')
  async banUser(@AuthUser() user: User, @Param('id') userId: string) {
    await this.adminService.banUser(userId);
    this.auditService.logAction(user.id, 'BAN_USER', 'User', userId);
    return { success: true };
  }

  @Patch('users/:id/unban')
  async unbanUser(@AuthUser() user: User, @Param('id') userId: string) {
    await this.adminService.unbanUser(userId);
    this.auditService.logAction(user.id, 'UNBAN_USER', 'User', userId);
    return { success: true };
  }

  @Patch('users/:id/role')
  async changeUserRole(
    @AuthUser() user: User,
    @Param('id') userId: string,
    @Body() body: { role: 'USER' | 'MODERATOR' | 'ADMIN' },
  ) {
    await this.adminService.changeUserRole(userId, body.role);
    this.auditService.logAction(user.id, 'CHANGE_ROLE', 'User', userId, {
      newRole: body.role,
    });
    return { success: true };
  }

  @Delete('messages/:id')
  async deleteMessage(
    @AuthUser() user: User,
    @Param('id') messageId: string,
  ) {
    await this.adminService.deleteMessageAsAdmin(messageId, false);
    this.auditService.logAction(user.id, 'DELETE_MESSAGE', 'Message', messageId);
    return { success: true };
  }

  @Delete('groups/:groupId/messages/:id')
  async deleteGroupMessage(
    @AuthUser() user: User,
    @Param('groupId') groupId: string,
    @Param('id') messageId: string,
  ) {
    await this.adminService.deleteMessageAsAdmin(messageId, true);
    this.auditService.logAction(
      user.id,
      'DELETE_GROUP_MESSAGE',
      'GroupMessage',
      messageId,
      { groupId },
    );
    return { success: true };
  }

  @Post('reports')
  async createReport(
    @AuthUser() user: User,
    @Body()
    body: {
      reportedUserId?: string;
      messageId?: string;
      reason: string;
      description?: string;
    },
  ) {
    const report = await this.adminService.createReport(
      user.id,
      body.reportedUserId || null,
      body.messageId || null,
      body.reason,
      body.description,
    );
    return report;
  }

  @Get('reports')
  @SkipThrottle()
  async listReports(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const [reports, total] = await this.adminService.listReports(
      status,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
    return { reports, total };
  }

  @Patch('reports/:id')
  async updateReportStatus(
    @AuthUser() user: User,
    @Param('id') reportId: string,
    @Body() body: { status: 'pending' | 'reviewed' | 'resolved' | 'dismissed' },
  ) {
    await this.adminService.updateReportStatus(reportId, body.status);
    this.auditService.logAction(
      user.id,
      'UPDATE_REPORT_STATUS',
      'Report',
      reportId,
      { status: body.status },
    );
    return { success: true };
  }

  @Get('audit-logs')
  @SkipThrottle()
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.getLogs({
      userId,
      action,
      entity,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
