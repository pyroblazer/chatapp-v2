import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../utils/typeorm';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    if (!userId) return false;

    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'role'],
    });
    if (!user) return false;

    // Attach role to request.user so controllers can use it
    request.user.role = user.role;
    return user.role === 'ADMIN' || user.role === 'MODERATOR';
  }
}
