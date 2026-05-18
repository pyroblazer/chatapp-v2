import { createAsyncThunk, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '.';
import { getConversationUnreadCount } from '../utils/api';

interface UnreadState {
  conversationCounts: Record<string, number>;
  groupCounts: Record<string, number>;
}

const initialState: UnreadState = {
  conversationCounts: {},
  groupCounts: {},
};

export const fetchAllConversationUnreadCountsThunk = createAsyncThunk(
  'unread/fetchAll',
  async (conversationIds: string[]) => {
    const results = await Promise.allSettled(
      conversationIds.map((id) =>
        getConversationUnreadCount(id).then((res) => ({
          id,
          count: res.data.unreadCount,
        }))
      )
    );
    const counts: Record<string, number> = {};
    for (const result of results) {
      if (result.status === 'fulfilled') {
        counts[result.value.id] = result.value.count;
      }
    }
    return counts;
  }
);

export const unreadSlice = createSlice({
  name: 'unread',
  initialState,
  reducers: {
    setConversationUnread(state, action: PayloadAction<{ id: string; count: number }>) {
      state.conversationCounts[action.payload.id] = action.payload.count;
    },
    clearConversationUnread(state, action: PayloadAction<string>) {
      state.conversationCounts[action.payload] = 0;
    },
    incrementConversationUnread(state, action: PayloadAction<string>) {
      state.conversationCounts[action.payload] = (state.conversationCounts[action.payload] ?? 0) + 1;
    },
    clearGroupUnread(state, action: PayloadAction<string>) {
      state.groupCounts[action.payload] = 0;
    },
    incrementGroupUnread(state, action: PayloadAction<string>) {
      state.groupCounts[action.payload] = (state.groupCounts[action.payload] ?? 0) + 1;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchAllConversationUnreadCountsThunk.fulfilled, (state, action) => {
      state.conversationCounts = { ...state.conversationCounts, ...action.payload };
    });
  },
});

const selectConversationCounts = (state: RootState) => state.unread.conversationCounts;
const selectGroupCounts = (state: RootState) => state.unread.groupCounts;

export const selectTotalUnreadConversations = createSelector(
  selectConversationCounts,
  (counts) => Object.values(counts).reduce((a, b) => a + b, 0)
);

export const selectTotalUnreadGroups = createSelector(
  selectGroupCounts,
  (counts) => Object.values(counts).reduce((a, b) => a + b, 0)
);

export const selectTotalUnread = createSelector(
  selectTotalUnreadConversations,
  selectTotalUnreadGroups,
  (a, b) => a + b
);

export const {
  setConversationUnread,
  clearConversationUnread,
  incrementConversationUnread,
  clearGroupUnread,
  incrementGroupUnread,
} = unreadSlice.actions;

export default unreadSlice.reducer;
