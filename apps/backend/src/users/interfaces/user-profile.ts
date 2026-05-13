import type { User } from '../../utils/typeorm';
import type { UpdateUserProfileParams } from '../../utils/types';

export interface IUserProfile {
  createProfile();
  updateProfile(user: User, params: UpdateUserProfileParams);
  createProfileOrUpdate(user: User, params: UpdateUserProfileParams);
}
