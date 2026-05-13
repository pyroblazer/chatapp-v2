import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Services } from '../utils/constants';
import { Notification } from './notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationsController],
  providers: [
    {
      provide: Services.NOTIFICATIONS,
      useClass: NotificationsService,
    },
  ],
  exports: [Services.NOTIFICATIONS],
})
export class NotificationsModule {}
