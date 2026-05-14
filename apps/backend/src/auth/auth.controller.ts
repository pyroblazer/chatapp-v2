import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import type { Request, Response } from 'express';
import type { IUserService } from '../users/interfaces/user';
import { Routes, Services } from '../utils/constants';
import type { IAuthService } from './auth';
import { CreateUserDto } from './dtos/CreateUser.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthUser } from '../utils/decorators';
import { Public } from '../utils/public.decorator';
import * as crypto from 'crypto';

@Controller(Routes.AUTH)
export class AuthController {
  constructor(
    @Inject(Services.AUTH) private authService: IAuthService,
    @Inject(Services.USERS) private userService: IUserService,
  ) {}

  @Public()
  @Post('register')
  async registerUser(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.createUser(createUserDto);
    const tokens = await this.authService.generateTokens(user);
    return { user: instanceToPlain(user), ...tokens };
  }

  @Public()
  @Post('login')
  async login(
    @Body() body: { username: string; password: string },
    @Res() res: Response,
  ) {
    const user = await this.authService.validateUser(
      body.username,
      body.password,
    );
    if (!user) {
      throw new HttpException('Invalid Credentials', HttpStatus.UNAUTHORIZED);
    }
    const tokens = await this.authService.generateTokens(user);
    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.ENVIRONMENT === 'PRODUCTION',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });
    return res.json({
      user: instanceToPlain(user),
      accessToken: tokens.accessToken,
    });
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new HttpException('No refresh token', HttpStatus.UNAUTHORIZED);
    }
    const tokens = await this.authService.refreshAccessToken(refreshToken);
    if (!tokens) {
      throw new HttpException('Invalid refresh token', HttpStatus.UNAUTHORIZED);
    }
    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.ENVIRONMENT === 'PRODUCTION',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });
    return res.json({ accessToken: tokens.accessToken });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@AuthUser() user: { id: string; username: string }) {
    const fullUser = await this.userService.findUser({ id: user.id });
    if (!fullUser) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return instanceToPlain(fullUser);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken) {
      const tokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');
      await this.authService.revokeRefreshToken(tokenHash);
    }
    res.clearCookie('refresh_token', { path: '/api/auth' });
    return res.send(HttpStatus.OK);
  }
}
