import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TransferOwnerDto {
  @ApiProperty({ description: 'User ID of the new group owner', example: 'uuid-string' })
  @IsNotEmpty()
  @IsString()
  newOwnerId: string;
}
