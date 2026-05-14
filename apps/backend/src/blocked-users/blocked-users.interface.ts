import type { User } from '../utils/typeorm';

export interface IBlockedUsersService {
  getBlockedUsers(userId: string): Promise<User[]>;
  blockUser(userId: string, username: string): Promise<User>;
  unblockUser(userId: string, username: string): Promise<void>;
}
