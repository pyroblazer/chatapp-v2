import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateReportDto {
  @ApiProperty({
    description: 'ID of the reported user',
    required: false,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  reportedUserId?: string;

  @ApiProperty({
    description: 'ID of the reported message',
    required: false,
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsString()
  messageId?: string;

  @ApiProperty({
    description: 'Reason for the report',
    example: 'Inappropriate content',
  })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiProperty({
    description: 'Additional details',
    required: false,
    example: 'This user is spamming in multiple conversations',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
