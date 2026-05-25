import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Call } from '../utils/typeorm/entities/Call';
import { Services } from '../utils/constants';
import { CallHistoryService } from './call-history.service';
import { CallHistoryController } from './call-history.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Call])],
  controllers: [CallHistoryController],
  providers: [
    {
      provide: Services.CALL_HISTORY,
      useClass: CallHistoryService,
    },
  ],
  exports: [Services.CALL_HISTORY],
})
export class CallHistoryModule {}
