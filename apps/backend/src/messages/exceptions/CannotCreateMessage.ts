import { HttpException, HttpStatus } from '@nestjs/common';

export class CannotCreateMessageException extends HttpException {
  constructor(message?: string) {
    super(
      message ??
        'Cannot create message: you are not a participant of this conversation',
      HttpStatus.FORBIDDEN,
    );
  }
}
