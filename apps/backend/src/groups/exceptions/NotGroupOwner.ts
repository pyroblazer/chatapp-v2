import { HttpException, HttpStatus } from '@nestjs/common';

export class NotGroupOwnerException extends HttpException {
  constructor() {
    super('Forbidden: you are not the group owner', HttpStatus.FORBIDDEN);
  }
}
