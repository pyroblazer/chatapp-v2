import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class AddGroupRecipientDto {
  @ApiProperty({
    description: 'Username to add to the group',
    example: 'janedoe',
  })
  @IsNotEmpty()
  username: string;
}
