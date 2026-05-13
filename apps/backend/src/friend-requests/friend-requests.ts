import type { FriendRequest } from '../utils/typeorm';
import type {
  AcceptFriendRequestResponse,
  CancelFriendRequestParams,
  CreateFriendParams,
  FriendRequestParams,
} from '../utils/types';

export interface IFriendRequestService {
  accept(params: FriendRequestParams): Promise<AcceptFriendRequestResponse>;
  cancel(params: CancelFriendRequestParams): Promise<FriendRequest>;
  create(params: CreateFriendParams);
  reject(params: CancelFriendRequestParams): Promise<FriendRequest>;
  getFriendRequests(userId: number): Promise<FriendRequest[]>;
  isPending(userOneId: number, userTwoId: number);
  findById(id: number): Promise<FriendRequest>;
}
