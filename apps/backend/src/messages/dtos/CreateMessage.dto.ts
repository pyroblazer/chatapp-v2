import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({
    description: 'Message content (optional if sending attachments)',
    example: 'Hello!',
    required: false,
  })
  @IsOptional()
  @IsString()
  content: string;

  @ApiProperty({
    description: 'Parent message ID for thread replies',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsString()
  parentMessageId?: string;
}
