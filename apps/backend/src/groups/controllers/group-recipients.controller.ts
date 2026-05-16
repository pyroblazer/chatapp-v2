import {
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  Body,
  Inject,
  Delete,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Routes, Services } from '../../utils/constants';
import { AuthUser } from '../../utils/decorators';
import type { User } from '../../utils/typeorm';
import { AddGroupRecipientDto } from '../dtos/AddGroupRecipient.dto';
import type { IGroupRecipientService } from '../interfaces/group-recipient';

@SkipThrottle()
@ApiTags('Groups')
@ApiBearerAuth()
@Controller(Routes.GROUP_RECIPIENTS)
export class GroupRecipientsController {
  constructor(
    @Inject(Services.GROUP_RECIPIENTS)
    private readonly groupRecipientService: IGroupRecipientService,
    private eventEmitter: EventEmitter2,
  ) {}

  @ApiOperation({ summary: 'Add a user to a group' })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 400 })
  @Post()
  async addGroupRecipient(
    @AuthUser() { id: userId }: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() { username }: AddGroupRecipientDto,
  ) {
    const params = { id, userId, username };
    const response = await this.groupRecipientService.addGroupRecipient(params);
    this.eventEmitter.emit('group.user.add', response);
    return response;
  }

  /**
   * Leaves a Group
   * @param user the authenticated User
   * @param groupId the id of the group
   * @returns the updated Group that the user had left
   */
  @ApiOperation({ summary: 'Leave a group' })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiResponse({ status: 200 })
  @Delete('leave')
  async leaveGroup(
    @AuthUser() user: User,
    @Param('id', ParseUUIDPipe) groupId: string,
  ) {
    const group = await this.groupRecipientService.leaveGroup({
      id: groupId,
      userId: user.id,
    });
    this.eventEmitter.emit('group.user.leave', { group, userId: user.id });
    return group;
  }

  @ApiOperation({ summary: 'Remove a user from a group' })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiParam({ name: 'userId', description: 'User UUID to remove' })
  @ApiResponse({ status: 200 })
  @Delete(':userId')
  async removeGroupRecipient(
    @AuthUser() { id: issuerId }: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) removeUserId: string,
  ) {
    const params = { issuerId, id, removeUserId };
    const response = await this.groupRecipientService.removeGroupRecipient(
      params,
    );
    this.eventEmitter.emit('group.user.remove', response);
    return response.group;
  }
}
