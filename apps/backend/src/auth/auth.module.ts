import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { AuditModule } from '../audit/audit.module';
import { Services } from '../utils/constants';
import { RefreshToken } from '../utils/typeorm/entities/RefreshToken';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    AuditModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret)
          throw new Error('JWT_SECRET environment variable is required');
        return { secret, signOptions: { expiresIn: '15m' } };
      },
    }),
    TypeOrmModule.forFeature([RefreshToken]),
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    {
      provide: Services.AUTH,
      useClass: AuthService,
    },
  ],
  exports: [Services.AUTH],
})
export class AuthModule {}
