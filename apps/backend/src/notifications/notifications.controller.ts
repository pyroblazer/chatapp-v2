import {
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Routes, Services } from '../utils/constants';
import { AuthUser } from '../utils/decorators';
import type { User } from '../utils/typeorm';
import type { INotificationsService } from './notifications.interface';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller(Routes.NOTIFICATIONS)
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    @Inject(Services.NOTIFICATIONS)
    private readonly notificationsService: INotificationsService,
  ) {}

  @Get()
  @SkipThrottle()
  @ApiOperation({ summary: 'Get notifications for the authenticated user' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Max results',
    example: '20',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Offset for pagination',
    example: '0',
  })
  async getNotifications(
    @AuthUser() user: User,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.notificationsService.getNotifications(
      user.id,
      limit ? parseInt(limit, 10) : undefined,
      offset ? parseInt(offset, 10) : undefined,
    );
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@AuthUser() user: User) {
    await this.notificationsService.markAllAsRead(user.id);
    return { success: true };
  }

  @Get('unread-count')
  @SkipThrottle()
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@AuthUser() user: User) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', description: 'Notification UUID' })
  async markAsRead(@AuthUser() user: User, @Param('id') id: string) {
    await this.notificationsService.markAsRead(id, user.id);
    return { success: true };
  }
}
