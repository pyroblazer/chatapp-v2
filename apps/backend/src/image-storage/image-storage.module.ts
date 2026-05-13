import { Module } from '@nestjs/common';
import { Services } from '../utils/constants';
import { ImageStorageService } from './image-storage.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  providers: [
    {
      provide: Services.SPACES_CLIENT,
      useExisting: Services.STORAGE_SERVICE,
    },
    {
      provide: Services.IMAGE_UPLOAD_SERVICE,
      useClass: ImageStorageService,
    },
  ],
  exports: [Services.SPACES_CLIENT, Services.IMAGE_UPLOAD_SERVICE],
})
export class ImageStorageModule {}
