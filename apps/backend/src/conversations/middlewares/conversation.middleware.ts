import {
  Inject,
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import { Services } from '../../utils/constants';
import type { AuthenticatedRequest } from '../../utils/types';
import type { IConversationsService } from '../conversations';
import { ConversationNotFoundException } from '../exceptions/ConversationNotFound';
import { InvalidConversationIdException } from '../exceptions/InvalidConversationId';

@Injectable()
export class ConversationMiddleware implements NestMiddleware {
  constructor(
    @Inject(Services.CONVERSATIONS)
    private readonly conversationService: IConversationsService,
  ) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const { id: userId } = req.user;
    const id = req.params.id;
    if (!id) throw new InvalidConversationIdException();
    const UUID_REGEX =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(id)) throw new InvalidConversationIdException();
    const isReadable = await this.conversationService.hasAccess({ id, userId });
    if (isReadable) next();
    else throw new ConversationNotFoundException();
  }
}
