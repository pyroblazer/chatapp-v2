import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class EditMessageDto {
  @ApiProperty({
    description: 'Updated message content',
    example: 'Hello, world!',
  })
  @IsNotEmpty()
  @IsString()
  content: string;
}
