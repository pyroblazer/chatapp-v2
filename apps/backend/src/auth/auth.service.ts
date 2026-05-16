import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compareHash, hashPassword } from '../utils/helpers';
import { Services } from '../utils/constants';
import type { IUserService } from '../users/interfaces/user';
import type { IAuthService, IJwtPayload } from './auth';
import { Repository } from 'typeorm';
import { RefreshToken } from '../utils/typeorm/entities/RefreshToken';
import type { User } from '../utils/typeorm';
import * as crypto from 'crypto';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject(Services.USERS) private readonly userService: IUserService,
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.userService.findUser(
      { username },
      { selectAll: true },
    );
    if (!user) return null;
    const isPasswordValid = await compareHash(password, user.password);
    return isPasswordValid ? user : null;
  }

  async generateTokens(user: User) {
    const payload: IJwtPayload = { sub: user.id, username: user.username };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenRepo.save(
      this.refreshTokenRepo.create({
        tokenHash,
        userId: user.id,
        expiresAt,
      }),
    );

    return { accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<IJwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const tokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');
      const storedToken = await this.refreshTokenRepo.findOne({
        where: { tokenHash, revoked: false },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) return null;

      await this.refreshTokenRepo.update(
        { id: storedToken.id },
        { revoked: true },
      );

      const user = await this.userService.findUser({ id: payload.sub });
      if (!user) return null;

      return this.generateTokens(user);
    } catch {
      return null;
    }
  }

  async revokeRefreshToken(tokenHash: string) {
    await this.refreshTokenRepo.update({ tokenHash }, { revoked: true });
  }

  async revokeAllUserTokens(userId: string) {
    await this.refreshTokenRepo.update(
      { userId, revoked: false },
      { revoked: true },
    );
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.userService.findUser(
      { id: userId },
      { selectAll: true },
    );
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    const isValid = await compareHash(currentPassword, user.password);
    if (!isValid)
      throw new HttpException(
        'Current password is incorrect',
        HttpStatus.UNAUTHORIZED,
      );

    const hashed = await hashPassword(newPassword);
    await this.userService.saveUser({ ...user, password: hashed });
    await this.revokeAllUserTokens(userId);
  }
}
