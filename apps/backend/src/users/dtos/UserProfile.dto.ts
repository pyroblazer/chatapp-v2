import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UserProfileDto {
  @ApiProperty({ description: 'Username for the profile', example: 'johndoe' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(18)
  username: string;

  @ApiProperty({
    description: 'About me text',
    example: 'Hello, I am John!',
    required: false,
  })
  @IsString()
  @MaxLength(200)
  about?: string;
}
