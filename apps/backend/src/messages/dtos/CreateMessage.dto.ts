import { IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
  content: string;

  @IsOptional()
  @IsString()
  parentMessageId?: string;
}
