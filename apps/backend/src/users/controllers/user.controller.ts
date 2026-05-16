import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Routes, Services } from '../../utils/constants';
import { Public } from '../../utils/public.decorator';
import type { IUserService } from '../interfaces/user';

@ApiTags('Users')
@ApiBearerAuth()
@Controller(Routes.USERS)
export class UsersController {
  constructor(
    @Inject(Services.USERS) private readonly userService: IUserService,
  ) {}

  @ApiOperation({ summary: 'Search users by username' })
  @ApiQuery({ name: 'query', description: 'Search query', example: 'john' })
  @ApiResponse({ status: 200 })
  @Get('search')
  @UseGuards(JwtAuthGuard)
  searchUsers(@Query('query') query: string) {
    if (!query)
      throw new HttpException('Provide a valid query', HttpStatus.BAD_REQUEST);
    return this.userService.searchUsers(query);
  }

  @ApiOperation({ summary: 'Check if username is available' })
  @ApiQuery({
    name: 'username',
    description: 'Username to check',
    example: 'johndoe',
  })
  @ApiResponse({ status: 200 })
  @Throttle(20, 60)
  @Public()
  @Get('check')
  async checkUsername(@Query('username') username: string) {
    if (!username)
      throw new HttpException('Invalid Query', HttpStatus.BAD_REQUEST);
    const exists = await this.userService.usernameExists(username);
    return { exists };
  }
}
