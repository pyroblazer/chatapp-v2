import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum } from 'class-validator';

export enum UserRole {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
}

export class ChangeRoleDto {
  @ApiProperty({
    description: 'New user role',
    enum: UserRole,
    example: UserRole.MODERATOR,
  })
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;
}
