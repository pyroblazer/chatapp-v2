import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Friend, FriendRequest, Points } from '../../utils/types';
import {
  acceptFriendRequestThunk,
  cancelFriendRequestThunk,
  createFriendRequestThunk,
  fetchFriendRequestThunk,
  fetchFriendsThunk,
  rejectFriendRequestThunk,
  removeFriendThunk,
} from './friendsThunk';

export type UserStatus = 'online' | 'offline';

export interface FriendsState {
  friends: Friend[];
  friendRequests: FriendRequest[];
  onlineFriends: Friend[];
  offlineFriends: Friend[];
  userStatuses: Record<string, UserStatus>;
  showContextMenu: boolean;
  selectedFriendContextMenu?: Friend;
  points: Points;
}

const initialState: FriendsState = {
  friends: [],
  friendRequests: [],
  onlineFriends: [],
  offlineFriends: [],
  userStatuses: {},
  showContextMenu: false,
  points: { x: 0, y: 0 },
};

export const friendsSlice = createSlice({
  name: 'friends',
  initialState,
  reducers: {
    addFriendRequest: (state, action: PayloadAction<FriendRequest>) => {
      state.friendRequests.push(action.payload);
    },
    removeFriendRequest: (state, action: PayloadAction<FriendRequest>) => {
      const { id } = action.payload;
      state.friendRequests = state.friendRequests.filter(
        (friendRequest) => friendRequest.id !== id
      );
    },
    removeFriend: (state, action: PayloadAction<Friend>) => {
      state.friends = state.friends.filter(
        (friend) => friend.id !== action.payload.id
      );
    },
    setOnlineFriends: (state, action: PayloadAction<Friend[]>) => {
      state.onlineFriends = action.payload;
      action.payload.forEach((friend) => {
        state.userStatuses[friend.id] = 'online';
      });
    },
    setOfflineFriends: (state) => {
      state.offlineFriends = state.friends.filter(
        (friend) =>
          !state.onlineFriends.find(
            (onlineFriend) => onlineFriend.id === friend.id
          )
      );
      state.offlineFriends.forEach((friend) => {
        if (!state.userStatuses[friend.id] || state.userStatuses[friend.id] === 'online') {
          state.userStatuses[friend.id] = 'offline';
        }
      });
    },
    setUserStatus: (state, action: PayloadAction<{ userId: string; status: UserStatus }>) => {
      state.userStatuses[action.payload.userId] = action.payload.status;
    },
    toggleContextMenu: (state, action: PayloadAction<boolean>) => {
      state.showContextMenu = action.payload;
    },
    setSelectedFriend: (state, action: PayloadAction<Friend>) => {
      state.selectedFriendContextMenu = action.payload;
    },
    setContextMenuLocation: (state, action: PayloadAction<Points>) => {
      state.points = action.payload;
    },
  },
  extraReducers: (builder) =>
    builder
      .addCase(fetchFriendsThunk.fulfilled, (state, action) => {
        state.friends = action.payload.data;
      })
      .addCase(fetchFriendRequestThunk.fulfilled, (state, action) => {
        state.friendRequests = action.payload.data;
      })
      .addCase(createFriendRequestThunk.fulfilled, (state, action) => {
        state.friendRequests.push(action.payload.data);
      })
      .addCase(createFriendRequestThunk.rejected, (state, action) => {
      })
      .addCase(cancelFriendRequestThunk.fulfilled, (state, action) => {
        const { id } = action.payload.data;
        state.friendRequests = state.friendRequests.filter(
          (friendRequest) => friendRequest.id !== id
        );
      })
      .addCase(acceptFriendRequestThunk.fulfilled, (state, action) => {
        const {
          friendRequest: { id },
        } = action.payload.data;
        state.friendRequests = state.friendRequests.filter(
          (friendRequest) => friendRequest.id !== id
        );
      })
      .addCase(rejectFriendRequestThunk.fulfilled, (state, action) => {
        const { id } = action.payload.data;
        state.friendRequests = state.friendRequests.filter(
          (friendRequest) => friendRequest.id !== id
        );
      })
      .addCase(removeFriendThunk.fulfilled, (state, action) => {
        state.friends = state.friends.filter(
          (friend) => friend.id !== action.payload.data.id
        );
      }),
});

export const {
  addFriendRequest,
  removeFriendRequest,
  setOnlineFriends,
  setOfflineFriends,
  setUserStatus,
  toggleContextMenu,
  setContextMenuLocation,
  setSelectedFriend,
  removeFriend,
} = friendsSlice.actions;
export default friendsSlice.reducer;
