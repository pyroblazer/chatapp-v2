import { Global, Module } from '@nestjs/common';
import { Services } from '../utils/constants';
import { StorageService } from './storage.service';

@Global()
@Module({
  providers: [
    {
      provide: Services.STORAGE_SERVICE,
      useClass: StorageService,
    },
  ],
  exports: [Services.STORAGE_SERVICE],
})
export class StorageModule {}
