import { HttpException, HttpStatus } from '@nestjs/common';

export class FriendRequestAcceptedException extends HttpException {
  constructor() {
    super('Friend Request already accepted', HttpStatus.CONFLICT);
  }
}
