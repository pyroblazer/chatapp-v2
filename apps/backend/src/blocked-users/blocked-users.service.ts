import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../utils/typeorm';
import type { IBlockedUsersService } from './blocked-users.interface';

@Injectable()
export class BlockedUsersService implements IBlockedUsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getBlockedUsers(userId: string): Promise<User[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['blockedUsers'],
    });
    return user?.blockedUsers ?? [];
  }

  async blockUser(userId: string, username: string): Promise<User> {
    if (!username)
      throw new HttpException('Username is required', HttpStatus.BAD_REQUEST);
    const [user, target] = await Promise.all([
      this.userRepository.findOne({
        where: { id: userId },
        relations: ['blockedUsers'],
      }),
      this.userRepository.findOne({ where: { username } }),
    ]);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    if (!target)
      throw new HttpException('Target user not found', HttpStatus.NOT_FOUND);
    if (target.id === userId)
      throw new HttpException('Cannot block yourself', HttpStatus.BAD_REQUEST);
    const alreadyBlocked = user.blockedUsers.some((u) => u.id === target.id);
    if (alreadyBlocked)
      throw new HttpException('User is already blocked', HttpStatus.CONFLICT);
    user.blockedUsers.push(target);
    await this.userRepository.save(user);
    return target;
  }

  async unblockUser(userId: string, username: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['blockedUsers'],
    });
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    user.blockedUsers = user.blockedUsers.filter((u) => u.username !== username);
    await this.userRepository.save(user);
  }
}
