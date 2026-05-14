import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Services } from '../utils/constants';
import { User } from '../utils/typeorm';
import { BlockedUsersController } from './blocked-users.controller';
import { BlockedUsersService } from './blocked-users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [
    {
      provide: Services.BLOCKED_USERS,
      useClass: BlockedUsersService,
    },
  ],
  controllers: [BlockedUsersController],
})
export class BlockedUsersModule {}
