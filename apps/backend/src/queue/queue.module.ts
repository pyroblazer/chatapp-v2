import { Module } from '@nestjs/common';
import { Services } from '../utils/constants';
import { FileUploadProcessor } from './processors/file-upload.processor';
import { NotificationProcessor } from './processors/notification.processor';
import { AuditProcessor } from './processors/audit.processor';
import { StorageModule } from '../storage/storage.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [StorageModule, GatewayModule],
  providers: [
    {
      provide: Services.FILE_UPLOAD_PROCESSOR,
      useClass: FileUploadProcessor,
    },
    {
      provide: Services.NOTIFICATION_PROCESSOR,
      useClass: NotificationProcessor,
    },
    {
      provide: Services.AUDIT_PROCESSOR,
      useClass: AuditProcessor,
    },
  ],
})
export class QueueModule {}
