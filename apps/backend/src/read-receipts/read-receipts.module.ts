import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Services } from '../utils/constants';
import { Message, ReadReceipt } from '../utils/typeorm';
import { ReadReceiptsController } from './read-receipts.controller';
import { ReadReceiptsService } from './read-receipts.service';

@Module({
  imports: [TypeOrmModule.forFeature([ReadReceipt, Message])],
  controllers: [ReadReceiptsController],
  providers: [
    {
      provide: Services.READ_RECEIPTS,
      useClass: ReadReceiptsService,
    },
  ],
  exports: [Services.READ_RECEIPTS],
})
export class ReadReceiptsModule {}
