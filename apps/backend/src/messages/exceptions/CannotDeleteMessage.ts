import { HttpException, HttpStatus } from '@nestjs/common';

export class CannotDeleteMessage extends HttpException {
  constructor() {
    super(
      'Cannot delete message: insufficient permissions',
      HttpStatus.FORBIDDEN,
    );
  }
}
