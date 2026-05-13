import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Services } from '../utils/constants';
import { AuditLog } from './audit-log.entity';
import { AuditService } from './audit.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [
    {
      provide: Services.AUDIT,
      useClass: AuditService,
    },
  ],
  exports: [Services.AUDIT],
})
export class AuditModule {}
