import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({
    description: 'Group title',
    example: 'My Group',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title: string;

  @ApiProperty({
    description: 'Array of usernames to add to the group',
    example: ['janedoe', 'bobsmith'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  users: string[];
}
