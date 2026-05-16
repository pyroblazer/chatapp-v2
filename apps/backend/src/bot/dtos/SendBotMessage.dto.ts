import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendBotMessageDto {
  @ApiProperty({
    description: 'Message content to send to the bot',
    example: 'Hello, how are you?',
  })
  @IsNotEmpty()
  @IsString()
  content: string;
}
