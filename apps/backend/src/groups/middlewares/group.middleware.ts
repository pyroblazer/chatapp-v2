import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import { Services } from '../../utils/constants';
import type { AuthenticatedRequest } from '../../utils/types';
import { GroupNotFoundException } from '../exceptions/GroupNotFound';
import { InvalidGroupException } from '../exceptions/InvalidGroup';
import type { IGroupService } from '../interfaces/group';

@Injectable()
export class GroupMiddleware implements NestMiddleware {
  constructor(
    @Inject(Services.GROUPS)
    private readonly groupService: IGroupService,
  ) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const { id: userId } = req.user;
    const id = req.params.id;

    if (!id) throw new InvalidGroupException();
    const params = { id, userId };
    const user = await this.groupService.hasAccess(params);
    if (user) next();
    else throw new GroupNotFoundException();
  }
}
