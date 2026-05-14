import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { blockUser, getBlockedUsers, unblockUser } from '../utils/api';
import { User } from '../utils/types';

export interface BlockedUsersState {
  blockedUsers: User[];
}

const initialState: BlockedUsersState = { blockedUsers: [] };

export const fetchBlockedUsersThunk = createAsyncThunk(
  'blockedUsers/fetch',
  () => getBlockedUsers(),
);

export const blockUserThunk = createAsyncThunk(
  'blockedUsers/block',
  (username: string) => blockUser(username),
);

export const unblockUserThunk = createAsyncThunk(
  'blockedUsers/unblock',
  (username: string) => unblockUser(username),
);

export const blockedUsersSlice = createSlice({
  name: 'blockedUsers',
  initialState,
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addCase(fetchBlockedUsersThunk.fulfilled, (state, action) => {
        state.blockedUsers = action.payload.data;
      })
      .addCase(blockUserThunk.fulfilled, (state, action) => {
        state.blockedUsers.push(action.payload.data);
      })
      .addCase(unblockUserThunk.fulfilled, (state, action) => {
        const username = action.meta.arg;
        state.blockedUsers = state.blockedUsers.filter(
          (u) => u.username !== username,
        );
      }),
});

export default blockedUsersSlice.reducer;
