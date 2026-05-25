import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Call } from '../utils/typeorm/entities/Call';
import { CallParticipant } from '../utils/typeorm/entities/CallParticipant';
import { Services } from '../utils/constants';
import { CallHistoryService } from './call-history.service';
import { CallHistoryController } from './call-history.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Call, CallParticipant])],
  controllers: [CallHistoryController],
  providers: [
    CallHistoryService,
    {
      provide: Services.CALL_HISTORY,
      useExisting: CallHistoryService,
    },
  ],
  exports: [CallHistoryService, Services.CALL_HISTORY],
})
export class CallHistoryModule {}
