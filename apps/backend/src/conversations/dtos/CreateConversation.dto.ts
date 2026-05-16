import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({ description: 'Username of the recipient', example: 'janedoe' })
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'Initial message content',
    example: 'Hey there!',
  })
  @IsNotEmpty()
  @IsString()
  message: string;
}
