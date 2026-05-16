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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminGuard } from './guards/admin.guard';
import { Routes, Services } from '../utils/constants';
import { AuthUser } from '../utils/decorators';
import type { User } from '../utils/typeorm';
import type { IAdminService } from './admin.interface';
import type { IAuditService } from '../audit/audit.interface';
import { ChangeRoleDto } from './dtos/ChangeRole.dto';
import { CreateReportDto } from './dtos/CreateReport.dto';
import { UpdateReportStatusDto } from './dtos/UpdateReportStatus.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller(Routes.ADMIN)
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    @Inject(Services.ADMIN)
    private readonly adminService: IAdminService,
    @Inject(Services.AUDIT)
    private readonly auditService: IAuditService,
  ) {}

  @Get('users')
  @SkipThrottle()
  @ApiOperation({ summary: 'List all users (admin)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async listUsers(
    @AuthUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const [users, total] = await this.adminService.listUsers(
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
      user.role,
    );
    return { users, total };
  }

  @Patch('users/:id/ban')
  @ApiOperation({ summary: 'Ban a user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async banUser(@AuthUser() user: User, @Param('id') userId: string) {
    await this.adminService.banUser(userId);
    this.auditService.logAction(user.id, 'BAN_USER', 'User', userId);
    return { success: true };
  }

  @Patch('users/:id/unban')
  @ApiOperation({ summary: 'Unban a user' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async unbanUser(@AuthUser() user: User, @Param('id') userId: string) {
    await this.adminService.unbanUser(userId);
    this.auditService.logAction(user.id, 'UNBAN_USER', 'User', userId);
    return { success: true };
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Change user role' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async changeUserRole(
    @AuthUser() user: User,
    @Param('id') userId: string,
    @Body() body: ChangeRoleDto,
  ) {
    await this.adminService.changeUserRole(userId, body.role);
    this.auditService.logAction(user.id, 'CHANGE_ROLE', 'User', userId, {
      newRole: body.role,
    });
    return { success: true };
  }

  @Delete('messages/:id')
  @ApiOperation({ summary: 'Delete a message (admin)' })
  @ApiParam({ name: 'id', description: 'Message UUID' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async deleteMessage(@AuthUser() user: User, @Param('id') messageId: string) {
    await this.adminService.deleteMessageAsAdmin(messageId, false);
    this.auditService.logAction(
      user.id,
      'DELETE_MESSAGE',
      'Message',
      messageId,
    );
    return { success: true };
  }

  @Delete('groups/:groupId/messages/:id')
  @ApiOperation({ summary: 'Delete a group message (admin)' })
  @ApiParam({ name: 'groupId' })
  @ApiParam({ name: 'id', description: 'Message UUID' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
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
  @ApiOperation({ summary: 'Create a report' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async createReport(@AuthUser() user: User, @Body() body: CreateReportDto) {
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
  @ApiOperation({ summary: 'List reports (admin)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 403, description: 'Admin access required' })
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
  @ApiOperation({ summary: 'Update report status' })
  @ApiParam({ name: 'id', description: 'Report UUID' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async updateReportStatus(
    @AuthUser() user: User,
    @Param('id') reportId: string,
    @Body() body: UpdateReportStatusDto,
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
  @ApiOperation({ summary: 'Get audit logs' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'entity', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const [logs, total] = await this.auditService.getLogs({
      userId,
      action,
      entity,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return { logs, total };
  }
}
