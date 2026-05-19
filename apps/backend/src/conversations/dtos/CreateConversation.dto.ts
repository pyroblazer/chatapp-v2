import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({ description: 'Username of the recipient', example: 'janedoe' })
  @IsNotEmpty()
  username: string;

  @ApiPropertyOptional({
    description: 'Optional initial message content',
    example: 'Hey there!',
  })
  @IsOptional()
  @IsString()
  message?: string;
}
