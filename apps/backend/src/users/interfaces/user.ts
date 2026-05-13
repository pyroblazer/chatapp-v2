import type { User } from '../../utils/typeorm';
import type {
  CreateUserDetails,
  FindUserOptions,
  FindUserParams,
} from '../../utils/types';

export interface IUserService {
  createUser(userDetails: CreateUserDetails): Promise<User>;
  findUser(
    findUserParams: FindUserParams,
    options?: FindUserOptions,
  ): Promise<User>;
  saveUser(user: User): Promise<User>;
  searchUsers(query: string): Promise<User[]>;
}
