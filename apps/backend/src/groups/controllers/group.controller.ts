import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { GroupNotFoundException } from '../exceptions/GroupNotFound';
import { Routes, Services } from '../../utils/constants';
import { AuthUser } from '../../utils/decorators';
import type { User } from '../../utils/typeorm';
import type { Attachment } from '../../utils/types';
import { CreateGroupDto } from '../dtos/CreateGroup.dto';
import { TransferOwnerDto } from '../dtos/TransferOwner.dto';
import { UpdateGroupDetailsDto } from '../dtos/UpdateGroupDetails.dto';
import type { IGroupService } from '../interfaces/group';

@SkipThrottle()
@ApiTags('Groups')
@ApiBearerAuth()
@Controller(Routes.GROUPS)
export class GroupController {
  constructor(
    @Inject(Services.GROUPS) private readonly groupService: IGroupService,
    private eventEmitter: EventEmitter2,
  ) {}

  @ApiOperation({ summary: 'Create a new group' })
  @ApiResponse({ status: 201 })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createGroup(@AuthUser() user: User, @Body() payload: CreateGroupDto) {
    const group = await this.groupService.createGroup({
      ...payload,
      creator: user,
    });
    this.eventEmitter.emit('group.create', group);
    return group;
  }

  @ApiOperation({ summary: 'Get all groups for the authenticated user' })
  @ApiResponse({ status: 200 })
  @Get()
  getGroups(@AuthUser() user: User) {
    return this.groupService.getGroups({ userId: user.id });
  }

  @ApiOperation({ summary: 'Get a group by ID' })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  @Get(':id')
  async getGroup(
    @AuthUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const group = await this.groupService.findGroupById(id);
    if (!group) throw new GroupNotFoundException();
    return group;
  }

  @ApiOperation({ summary: 'Transfer group ownership' })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403 })
  @Patch(':id/owner')
  async updateGroupOwner(
    @AuthUser() { id: userId }: User,
    @Param('id', ParseUUIDPipe) groupId: string,
    @Body() { newOwnerId }: TransferOwnerDto,
  ) {
    const params = { userId, groupId, newOwnerId };
    const group = await this.groupService.transferGroupOwner(params);
    this.eventEmitter.emit('group.owner.update', group);
    return group;
  }

  @ApiOperation({ summary: 'Update group details (title, avatar)' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiResponse({ status: 200 })
  @Patch(':id/details')
  @UseInterceptors(FileInterceptor('avatar'))
  async updateGroupDetails(
    @Body() { title }: UpdateGroupDetailsDto,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() avatar: Attachment,
  ) {
    return this.groupService.updateDetails({ id, avatar, title });
  }
}
