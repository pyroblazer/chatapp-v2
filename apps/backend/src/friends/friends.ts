import { Friend } from '../utils/typeorm';
import { DeleteFriendRequestParams } from '../utils/types';

export interface IFriendsService {
  getFriends(id: string): Promise<Friend[]>;
  findFriendById(id: string): Promise<Friend>;
  deleteFriend(params: DeleteFriendRequestParams);
  isFriends(userOneId: string, userTwoId: string): Promise<Friend | undefined>;
}
