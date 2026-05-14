import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Routes, Services } from '../utils/constants';
import { AuthUser } from '../utils/decorators';
import type { User } from '../utils/typeorm';
import type { IBlockedUsersService } from './blocked-users.interface';

@SkipThrottle()
@Controller(Routes.BLOCKED_USERS)
export class BlockedUsersController {
  constructor(
    @Inject(Services.BLOCKED_USERS)
    private readonly blockedUsersService: IBlockedUsersService,
  ) {}

  @Get()
  getBlockedUsers(@AuthUser() user: User) {
    return this.blockedUsersService.getBlockedUsers(user.id);
  }

  @Post(':username')
  blockUser(@AuthUser() user: User, @Param('username') username: string) {
    return this.blockedUsersService.blockUser(user.id, username);
  }

  @Delete(':username')
  @HttpCode(HttpStatus.NO_CONTENT)
  unblockUser(@AuthUser() user: User, @Param('username') username: string) {
    return this.blockedUsersService.unblockUser(user.id, username);
  }
}
