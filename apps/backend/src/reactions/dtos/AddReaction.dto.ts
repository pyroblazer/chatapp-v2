import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AddReactionDto {
  @ApiProperty({ description: 'Emoji reaction', example: '👍' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(10)
  emoji: string;
}
