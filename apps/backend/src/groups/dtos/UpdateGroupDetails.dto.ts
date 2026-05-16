import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateGroupDetailsDto {
  @ApiProperty({
    description: 'Updated group title',
    example: 'New Group Name',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;
}
