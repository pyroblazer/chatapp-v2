import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Services } from '../utils/constants';
import { User, Message, GroupMessage } from '../utils/typeorm';
import { Report } from './report.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, User, Message, GroupMessage]),
    AuditModule,
  ],
  controllers: [AdminController],
  providers: [
    {
      provide: Services.ADMIN,
      useClass: AdminService,
    },
  ],
  exports: [Services.ADMIN],
})
export class AdminModule {}
