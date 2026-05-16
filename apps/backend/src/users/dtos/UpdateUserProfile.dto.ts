import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateUserProfileDto {
  @ApiProperty({
    description: 'Updated about me text',
    example: 'Updated bio here',
    required: false,
  })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  about?: string;
}
