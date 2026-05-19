import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hashPassword } from '../../utils/helpers';
import { Peer, User } from '../../utils/typeorm';
import {
  CreateUserDetails,
  FindUserOptions,
  FindUserParams,
} from '../../utils/types';
import type { IUserService } from '../interfaces/user';

@Injectable()
export class UserService implements IUserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Peer) private readonly peerRepository: Repository<Peer>,
  ) {}

  async createUser(userDetails: CreateUserDetails) {
    const existingUser = await this.userRepository.findOne({
      where: { username: userDetails.username },
    });
    if (existingUser)
      throw new HttpException('User already exists', HttpStatus.CONFLICT);
    const password = await hashPassword(userDetails.password);
    const peer = this.peerRepository.create();
    const params = { ...userDetails, password, peer };
    const newUser = this.userRepository.create(params);
    try {
      return await this.userRepository.save(newUser);
    } catch (err: any) {
      if (err?.code === '23505' || err?.message?.includes('duplicate key')) {
        throw new HttpException('User already exists', HttpStatus.CONFLICT);
      }
      throw err;
    }
  }

  async findUser(
    params: FindUserParams,
    options?: FindUserOptions,
  ): Promise<User> {
    const selections: (keyof User)[] = [
      'email',
      'username',
      'firstName',
      'lastName',
      'id',
    ];
    const selectionsWithPassword: (keyof User)[] = [...selections, 'password'];
    return this.userRepository.findOne({
      where: params,
      select: options?.selectAll ? selectionsWithPassword : selections,
      relations: ['profile', 'presence', 'peer'],
    });
  }

  async saveUser(user: User) {
    return this.userRepository.save(user);
  }

  async usernameExists(username: string): Promise<boolean> {
    const result = await this.userRepository
      .createQueryBuilder('user')
      .select('1')
      .where('user.username = :username', { username })
      .limit(1)
      .getRawOne();
    return result !== undefined && result !== null;
  }

  searchUsers(query: string) {
    const statement = '(user.username LIKE :query)';
    return this.userRepository
      .createQueryBuilder('user')
      .where(statement, { query: `%${query}%` })
      .limit(10)
      .select([
        'user.username',
        'user.firstName',
        'user.lastName',
        'user.id',
        'user.profile',
      ])
      .getMany();
  }
}
