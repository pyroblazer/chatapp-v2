import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({ description: 'Unique username', example: 'johndoe' })
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(16)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username may only contain letters, numbers, and underscores',
  })
  @Transform(({ value }) => value?.trim())
  username: string;

  @ApiProperty({ description: 'First name', example: 'John' })
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(32)
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(32)
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @ApiProperty({
    description:
      'Password (min 8 chars, must include uppercase, lowercase, number, and special char)',
    example: 'MyPass123!',
  })
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;

  @ApiProperty({
    description: 'Email address (optional)',
    example: 'john@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Must be a valid email address' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email?: string;
}
