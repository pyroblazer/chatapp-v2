import { User } from '../utils/typeorm';

export interface IAuthService {
  validateUser(username: string, password: string): Promise<User | null>;
  generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }>;
  refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null>;
  revokeRefreshToken(tokenHash: string): Promise<void>;
}

export interface IJwtPayload {
  sub: string;
  username: string;
}
