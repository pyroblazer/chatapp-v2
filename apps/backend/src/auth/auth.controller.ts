import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { instanceToPlain } from 'class-transformer';
import type { Request, Response } from 'express';
import type { IUserService } from '../users/interfaces/user';
import { Routes, Services } from '../utils/constants';
import type { IAuthService } from './auth';
import { CreateUserDto } from './dtos/CreateUser.dto';
import { LoginDto } from './dtos/Login.dto';
import { ChangePasswordDto } from './dtos/ChangePassword.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthUser } from '../utils/decorators';
import { Public } from '../utils/public.decorator';
import { Throttle } from '@nestjs/throttler';
import type { IAuditService } from '../audit/audit.interface';
import * as crypto from 'crypto';

@ApiTags('Auth')
@Controller(Routes.AUTH)
export class AuthController {
  constructor(
    @Inject(Services.AUTH) private authService: IAuthService,
    @Inject(Services.USERS) private userService: IUserService,
    @Inject(Services.AUDIT) private auditService: IAuditService,
  ) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @Throttle(
    parseInt(process.env.AUTH_THROTTLE_LIMIT || '5', 10),
    parseInt(process.env.AUTH_THROTTLE_TTL || '60', 10),
  )
  @HttpCode(HttpStatus.CREATED)
  @Public()
  @Post('register')
  async registerUser(
    @Body() createUserDto: CreateUserDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = await this.userService.createUser(createUserDto);
    const tokens = await this.authService.generateTokens(user);
    await this.auditService.logAction(
      user.id,
      'REGISTER',
      'User',
      user.id,
      { username: user.username },
      req.ip,
    );
    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.ENVIRONMENT === 'PRODUCTION',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });
    return res.status(HttpStatus.CREATED).json({
      user: instanceToPlain(user),
      accessToken: tokens.accessToken,
    });
  }

  @ApiOperation({ summary: 'Login' })
  @ApiResponse({
    status: 200,
    description:
      'Login successful, returns access token and sets refresh token cookie',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429 })
  @Throttle(
    parseInt(process.env.AUTH_THROTTLE_LIMIT || '5', 10),
    parseInt(process.env.AUTH_THROTTLE_TTL || '60', 10),
  )
  @Public()
  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = await this.authService.validateUser(
      body.username,
      body.password,
    );
    if (!user) {
      await this.auditService.logAction(
        'anonymous',
        'LOGIN_FAILED',
        'User',
        undefined,
        { username: body.username },
        req.ip,
      );
      throw new HttpException('Invalid Credentials', HttpStatus.UNAUTHORIZED);
    }
    await this.auditService.logAction(
      user.id,
      'LOGIN',
      'User',
      user.id,
      { username: user.username },
      req.ip,
    );
    const tokens = await this.authService.generateTokens(user);
    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.ENVIRONMENT === 'PRODUCTION',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });
    return res.json({
      user: instanceToPlain(user),
      accessToken: tokens.accessToken,
    });
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
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
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });
    return res.json({ accessToken: tokens.accessToken });
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  @ApiResponse({ status: 401 })
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@AuthUser() user: { id: string; username: string }) {
    const fullUser = await this.userService.findUser({ id: user.id });
    if (!fullUser) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return instanceToPlain(fullUser);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({ status: 200, description: 'Password changed' })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 400, description: 'Invalid current password' })
  @Throttle(
    parseInt(process.env.AUTH_THROTTLE_LIMIT || '3', 10),
    parseInt(process.env.AUTH_THROTTLE_TTL || '60', 10),
  )
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @AuthUser() user: { id: string; username: string },
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ) {
    await this.authService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
    await this.auditService.logAction(
      user.id,
      'CHANGE_PASSWORD',
      'User',
      user.id,
      { username: user.username },
      req.ip,
    );
    return {
      message: 'Password changed successfully. All sessions have been revoked.',
    };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and clear tokens' })
  @ApiResponse({ status: 200, description: 'Logged out' })
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @AuthUser() user: { id: string; username: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken) {
      const tokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');
      await this.authService.revokeRefreshToken(tokenHash);
    }
    await this.auditService.logAction(
      user.id,
      'LOGOUT',
      'User',
      user.id,
      { username: user.username },
      req.ip,
    );
    res.clearCookie('refresh_token', { path: '/api/auth', sameSite: 'none', secure: process.env.ENVIRONMENT === 'PRODUCTION' });
    return res.status(HttpStatus.NO_CONTENT).send();
  }
}
