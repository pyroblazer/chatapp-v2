import { HttpException, HttpStatus } from '@nestjs/common';

export class CreateConversationException extends HttpException {
  constructor(msg?: string, status = HttpStatus.BAD_REQUEST) {
    const defaultMessage = 'Cannot create conversation';
    super(msg ?? defaultMessage, status);
  }
}
