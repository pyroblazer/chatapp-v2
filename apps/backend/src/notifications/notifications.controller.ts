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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Routes, Services } from '../utils/constants';
import { AuthUser } from '../utils/decorators';
import type { User } from '../utils/typeorm';
import type { INotificationsService } from './notifications.interface';

@Controller(Routes.NOTIFICATIONS)
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    @Inject(Services.NOTIFICATIONS)
    private readonly notificationsService: INotificationsService,
  ) {}

  @Get()
  @SkipThrottle()
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
  async markAllAsRead(@AuthUser() user: User) {
    await this.notificationsService.markAllAsRead(user.id);
    return { success: true };
  }

  @Get('unread-count')
  @SkipThrottle()
  async getUnreadCount(@AuthUser() user: User) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { count };
  }

  @Patch(':id/read')
  async markAsRead(@AuthUser() user: User, @Param('id') id: string) {
    await this.notificationsService.markAsRead(id, user.id);
    return { success: true };
  }
}
