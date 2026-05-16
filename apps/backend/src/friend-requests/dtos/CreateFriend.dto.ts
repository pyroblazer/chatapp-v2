import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateFriendDto {
  @ApiProperty({
    description: 'Username to send friend request to',
    example: 'janedoe',
  })
  @IsNotEmpty()
  username: string;
}
