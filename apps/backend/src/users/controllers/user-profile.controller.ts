import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Inject,
  Patch,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Routes, Services, UserProfileFileFields } from '../../utils/constants';
import { AuthUser } from '../../utils/decorators';
import type { User } from '../../utils/typeorm';
import type {
  UpdateUserProfileParams,
  UserProfileFiles,
} from '../../utils/types';
import { UpdateUserProfileDto } from '../dtos/UpdateUserProfile.dto';
import type { IUserProfile } from '../interfaces/user-profile';
import type { IUserService } from '../interfaces/user';

@ApiTags('Users')
@ApiBearerAuth()
@Controller(Routes.USERS_PROFILES)
export class UserProfilesController {
  constructor(
    @Inject(Services.USERS_PROFILES)
    private readonly userProfileService: IUserProfile,
    @Inject(Services.USERS)
    private readonly userService: IUserService,
  ) {}

  @ApiOperation({ summary: 'Update user profile (avatar, banner, about)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        about: {
          type: 'string',
          description: 'About me text',
          example: 'Hello world!',
        },
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Avatar image file',
        },
        banner: {
          type: 'string',
          format: 'binary',
          description: 'Banner image file',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @Patch()
  @UseInterceptors(FileFieldsInterceptor(UserProfileFileFields))
  async updateUserProfile(
    @AuthUser() user: User,
    @UploadedFiles()
    files: UserProfileFiles,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ) {
    const fullUser = await this.userService.findUser({ id: user.id });
    if (!fullUser) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    const params: UpdateUserProfileParams = {};
    if (updateUserProfileDto.about !== undefined)
      params.about = updateUserProfileDto.about;
    files?.banner && (params.banner = files.banner[0]);
    files?.avatar && (params.avatar = files.avatar[0]);
    return this.userProfileService.createProfileOrUpdate(fullUser, params);
  }
}
