import type { User, UserPresence } from '../../utils/typeorm';
import type { UpdateStatusMessageParams } from '../../utils/types';

export interface IUserPresenceService {
  createPresence(): Promise<UserPresence>;
  updateStatus(params: UpdateStatusMessageParams): Promise<User>;
}
