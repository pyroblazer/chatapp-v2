import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdatePresenceStatusDto {
  @ApiProperty({
    description: 'Status message to display',
    example: 'Available',
  })
  @IsString()
  statusMessage: string;
}
