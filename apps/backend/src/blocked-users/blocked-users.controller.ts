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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Routes, Services } from '../utils/constants';
import { AuthUser } from '../utils/decorators';
import type { User } from '../utils/typeorm';
import type { IBlockedUsersService } from './blocked-users.interface';

@ApiTags('Blocked Users')
@ApiBearerAuth()
@SkipThrottle()
@Controller(Routes.BLOCKED_USERS)
export class BlockedUsersController {
  constructor(
    @Inject(Services.BLOCKED_USERS)
    private readonly blockedUsersService: IBlockedUsersService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get blocked users list' })
  getBlockedUsers(@AuthUser() user: User) {
    return this.blockedUsersService.getBlockedUsers(user.id);
  }

  @Post(':username')
  @ApiOperation({ summary: 'Block a user' })
  @ApiParam({ name: 'username', description: 'Username to block/unblock' })
  blockUser(@AuthUser() user: User, @Param('username') username: string) {
    return this.blockedUsersService.blockUser(user.id, username);
  }

  @Delete(':username')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unblock a user' })
  @ApiParam({ name: 'username', description: 'Username to block/unblock' })
  unblockUser(@AuthUser() user: User, @Param('username') username: string) {
    return this.blockedUsersService.unblockUser(user.id, username);
  }
}
