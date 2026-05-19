import friendsReducer, {
  addFriendRequest,
  removeFriendRequest,
  setOnlineFriends,
  setOfflineFriends,
  setUserStatus,
  toggleContextMenu,
  setSelectedFriend,
  removeFriend,
  type FriendsState,
} from '../friendsSlice';
import { Friend, FriendRequest } from '../../../utils/types';

const mockUser = (id: number, username: string) => ({
  id,
  username,
  email: `${username}@test.com`,
  status: 'online' as const,
  createdAt: new Date().toString(),
  profile: undefined,
});

const mockFriend: Friend = {
  id: 1,
  sender: mockUser(1, 'alice'),
  receiver: mockUser(2, 'bob'),
  createdAt: Date.now(),
};

const mockFriendRequest: FriendRequest = {
  id: 10,
  sender: mockUser(3, 'charlie'),
  receiver: mockUser(1, 'alice'),
  createdAt: Date.now(),
  status: 'pending' as any,
};

describe('friendsSlice', () => {
  it('should return the correct initial state', () => {
    const result = friendsReducer(undefined, { type: 'unknown' });
    expect(result).toEqual({
      friends: [],
      friendRequests: [],
      onlineFriends: [],
      offlineFriends: [],
      userStatuses: {},
      showContextMenu: false,
      points: { x: 0, y: 0 },
    });
  });

  it('should populate friends via fetchFriendsThunk.fulfilled', () => {
    const action = {
      type: 'friends/fetch/fulfilled',
      payload: { data: [mockFriend] },
    };
    const result = friendsReducer(undefined, action);
    expect(result.friends).toHaveLength(1);
    expect(result.friends[0].id).toBe(1);
  });

  it('should populate friend requests via fetchFriendRequestThunk.fulfilled', () => {
    const action = {
      type: 'friends/requests/fetch/fulfilled',
      payload: { data: [mockFriendRequest] },
    };
    const result = friendsReducer(undefined, action);
    expect(result.friendRequests).toHaveLength(1);
    expect(result.friendRequests[0].id).toBe(10);
  });

  it('should add a friend request via addFriendRequest', () => {
    const state: FriendsState = {
      friends: [],
      friendRequests: [],
      onlineFriends: [],
      offlineFriends: [],
      showContextMenu: false,
      points: { x: 0, y: 0 },
    };
    const result = friendsReducer(state, addFriendRequest(mockFriendRequest));
    expect(result.friendRequests).toHaveLength(1);
    expect(result.friendRequests[0].id).toBe(10);
  });

  it('should remove a friend request via removeFriendRequest', () => {
    const state: FriendsState = {
      friends: [],
      friendRequests: [mockFriendRequest],
      onlineFriends: [],
      offlineFriends: [],
      showContextMenu: false,
      points: { x: 0, y: 0 },
    };
    const result = friendsReducer(state, removeFriendRequest(mockFriendRequest));
    expect(result.friendRequests).toHaveLength(0);
  });

  it('should remove a friend request via cancelFriendRequestThunk.fulfilled', () => {
    const state: FriendsState = {
      friends: [],
      friendRequests: [mockFriendRequest],
      onlineFriends: [],
      offlineFriends: [],
      showContextMenu: false,
      points: { x: 0, y: 0 },
    };
    const action = {
      type: 'friends/request/cancel/fulfilled',
      payload: { data: mockFriendRequest },
    };
    const result = friendsReducer(state, action);
    expect(result.friendRequests).toHaveLength(0);
  });

  it('should remove a friend request via acceptFriendRequestThunk.fulfilled', () => {
    const state: FriendsState = {
      friends: [],
      friendRequests: [mockFriendRequest],
      onlineFriends: [],
      offlineFriends: [],
      showContextMenu: false,
      points: { x: 0, y: 0 },
    };
    const action = {
      type: 'friends/request/accept/fulfilled',
      payload: { data: { friendRequest: mockFriendRequest } },
    };
    const result = friendsReducer(state, action);
    expect(result.friendRequests).toHaveLength(0);
  });

  it('should remove a friend request via rejectFriendRequestThunk.fulfilled', () => {
    const state: FriendsState = {
      friends: [],
      friendRequests: [mockFriendRequest],
      onlineFriends: [],
      offlineFriends: [],
      showContextMenu: false,
      points: { x: 0, y: 0 },
    };
    const action = {
      type: 'friends/request/reject/fulfilled',
      payload: { data: mockFriendRequest },
    };
    const result = friendsReducer(state, action);
    expect(result.friendRequests).toHaveLength(0);
  });

  it('should remove a friend via removeFriend', () => {
    const state: FriendsState = {
      friends: [mockFriend],
      friendRequests: [],
      onlineFriends: [],
      offlineFriends: [],
      showContextMenu: false,
      points: { x: 0, y: 0 },
    };
    const result = friendsReducer(state, removeFriend(mockFriend));
    expect(result.friends).toHaveLength(0);
  });

  it('should set online friends', () => {
    const state: FriendsState = {
      friends: [mockFriend],
      friendRequests: [],
      onlineFriends: [],
      offlineFriends: [],
      showContextMenu: false,
      points: { x: 0, y: 0 },
    };
    const result = friendsReducer(state, setOnlineFriends([mockFriend]));
    expect(result.onlineFriends).toHaveLength(1);
  });

  it('should compute offline friends from friends minus online friends', () => {
    const state: FriendsState = {
      friends: [mockFriend],
      friendRequests: [],
      onlineFriends: [],
      offlineFriends: [],
      showContextMenu: false,
      points: { x: 0, y: 0 },
    };
    const result = friendsReducer(state, setOfflineFriends());
    expect(result.offlineFriends).toHaveLength(1);
    expect(result.offlineFriends[0].id).toBe(1);
  });

  it('should toggle context menu', () => {
    const result = friendsReducer(undefined, toggleContextMenu(true));
    expect(result.showContextMenu).toBe(true);
  });

  // --- user status (added with call/presence feature) ---

  it('should set a user status via setUserStatus', () => {
    const result = friendsReducer(undefined, setUserStatus({ userId: '42', status: 'online' }));
    expect(result.userStatuses['42']).toBe('online');
  });

  it('should overwrite an existing user status via setUserStatus', () => {
    const state: FriendsState = {
      friends: [],
      friendRequests: [],
      onlineFriends: [],
      offlineFriends: [],
      userStatuses: { '42': 'online' },
      showContextMenu: false,
      points: { x: 0, y: 0 },
    };
    const result = friendsReducer(state, setUserStatus({ userId: '42', status: 'in-call' }));
    expect(result.userStatuses['42']).toBe('in-call');
  });

  it('should seed userStatuses to "online" for each friend in setOnlineFriends', () => {
    const state: FriendsState = {
      friends: [mockFriend],
      friendRequests: [],
      onlineFriends: [],
      offlineFriends: [],
      userStatuses: {},
      showContextMenu: false,
      points: { x: 0, y: 0 },
    };
    const result = friendsReducer(state, setOnlineFriends([mockFriend]));
    expect(result.userStatuses[mockFriend.id]).toBe('online');
  });

  it('should not downgrade "in-call" to "online" when seeding via setOnlineFriends', () => {
    const state: FriendsState = {
      friends: [mockFriend],
      friendRequests: [],
      onlineFriends: [],
      offlineFriends: [],
      userStatuses: { [mockFriend.id]: 'in-call' },
      showContextMenu: false,
      points: { x: 0, y: 0 },
    };
    const result = friendsReducer(state, setOnlineFriends([mockFriend]));
    expect(result.userStatuses[mockFriend.id]).toBe('in-call');
  });

  it('should set userStatuses to "offline" for friends not in onlineFriends via setOfflineFriends', () => {
    const friend2: Friend = {
      id: 2,
      sender: mockUser(1, 'alice'),
      receiver: mockUser(3, 'carol'),
      createdAt: Date.now(),
    };
    const state: FriendsState = {
      friends: [mockFriend, friend2],
      friendRequests: [],
      onlineFriends: [mockFriend], // only mockFriend is online
      offlineFriends: [],
      userStatuses: {},
      showContextMenu: false,
      points: { x: 0, y: 0 },
    };
    const result = friendsReducer(state, setOfflineFriends());
    expect(result.offlineFriends).toHaveLength(1);
    expect(result.offlineFriends[0].id).toBe(friend2.id);
    expect(result.userStatuses[friend2.id]).toBe('offline');
    // online friend's status should be untouched (not set to offline)
    expect(result.userStatuses[mockFriend.id]).toBeUndefined();
  });

  it('should not overwrite "in-call" with "offline" via setOfflineFriends', () => {
    const state: FriendsState = {
      friends: [mockFriend],
      friendRequests: [],
      onlineFriends: [],
      offlineFriends: [],
      userStatuses: { [mockFriend.id]: 'in-call' },
      showContextMenu: false,
      points: { x: 0, y: 0 },
    };
    const result = friendsReducer(state, setOfflineFriends());
    // in-call should be preserved — not downgraded to offline
    expect(result.userStatuses[mockFriend.id]).toBe('in-call');
  });
});
