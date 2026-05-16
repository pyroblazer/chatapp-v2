import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdatePresenceStatusDto {
  @ApiProperty({
    description: 'Status message to display',
    example: 'Available',
  })
  @IsNotEmpty()
  @IsString()
  statusMessage: string;
}
