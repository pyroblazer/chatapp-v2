import { Body, Controller, Inject, Patch } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Routes, Services } from '../../utils/constants';
import { AuthUser } from '../../utils/decorators';
import type { User } from '../../utils/typeorm';
import { UpdatePresenceStatusDto } from '../dtos/UpdatePresenceStatus.dto';
import type { IUserPresenceService } from '../interfaces/user-presence';

@ApiTags('Users')
@ApiBearerAuth()
@Controller(Routes.USER_PRESENCE)
export class UserPresenceController {
  constructor(
    @Inject(Services.USER_PRESENCE)
    private readonly userPresenceService: IUserPresenceService,
  ) {}

  @ApiOperation({ summary: 'Update presence status message' })
  @ApiResponse({ status: 200 })
  @Patch('status')
  updateStatus(
    @AuthUser() user: User,
    @Body() { statusMessage }: UpdatePresenceStatusDto,
  ) {
    return this.userPresenceService.updateStatus({ user, statusMessage });
  }
}
