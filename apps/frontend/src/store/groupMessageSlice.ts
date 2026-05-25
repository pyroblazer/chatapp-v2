import {
  createAsyncThunk,
  createSelector,
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit';
import { RootState } from '.';
import {
  deleteGroupMessage as deleteGroupMessageAPI,
  fetchGroupMessages as fetchGroupMessagesAPI,
  editGroupMessage as editGroupMessageAPI,
} from '../utils/api';
import {
  DeleteGroupMessageParams,
  EditMessagePayload,
  GroupMessage,
  GroupMessageEventPayload,
  GroupMessageType,
} from '../utils/types';

export interface GroupMessagesState {
  messages: GroupMessage[];
}

const initialState: GroupMessagesState = {
  messages: [],
};

export const fetchGroupMessagesThunk = createAsyncThunk(
  'groupMessages/fetch',
  (id: string) => fetchGroupMessagesAPI(id)
);

export const deleteGroupMessageThunk = createAsyncThunk(
  'groupMessages/delete',
  (params: DeleteGroupMessageParams) => deleteGroupMessageAPI(params)
);

export const editGroupMessageThunk = createAsyncThunk(
  'groupMessages/edit',
  (params: EditMessagePayload) => editGroupMessageAPI(params)
);

export const groupMessagesSlice = createSlice({
  name: 'groupMessages',
  initialState,
  reducers: {
    addGroupMessage: (
      state,
      action: PayloadAction<GroupMessageEventPayload>
    ) => {
      const { group, message } = action.payload;
      const groupMessage = state.messages.find((gm) => gm.id === group.id);
      if (!groupMessage) return;
      // Replace optimistic message if one exists from the same author
      const pendingIndex = groupMessage.messages.findIndex(
        (m) => m._pending && m.author?.id === message.author?.id && m.content === message.content
      );
      if (pendingIndex !== -1) {
        groupMessage.messages[pendingIndex] = message;
      } else {
        groupMessage.messages.unshift(message);
      }
    },
    addOptimisticGroupMessage: (state, action: PayloadAction<GroupMessageType>) => {
      const message = action.payload;
      const groupId = message.group?.id;
      if (!groupId) return;
      let groupMessage = state.messages.find((gm) => gm.id === groupId);
      if (!groupMessage) {
        groupMessage = { id: groupId, messages: [] };
        state.messages.push(groupMessage);
      }
      groupMessage.messages.unshift(message);
    },
    removeOptimisticGroupMessage: (state, action: PayloadAction<{ groupId: string; tempId: string }>) => {
      const { groupId, tempId } = action.payload;
      const groupMessage = state.messages.find((gm) => gm.id === groupId);
      if (!groupMessage) return;
      const index = groupMessage.messages.findIndex((m) => m.id === tempId);
      if (index !== -1) {
        groupMessage.messages.splice(index, 1);
      }
    },
    editGroupMessage: (state, action: PayloadAction<GroupMessageType>) => {
      const { payload } = action;
      const { id } = payload.group;
      const groupMessage = state.messages.find((gm) => gm.id === id);
      if (!groupMessage) return;
      const messageIndex = groupMessage.messages.findIndex(
        (m) => m.id === payload.id
      );
      groupMessage.messages[messageIndex] = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGroupMessagesThunk.fulfilled, (state, action) => {
        const { id } = action.payload.data;
        const index = state.messages.findIndex((gm) => gm.id === id);
        const exists = state.messages.find((gm) => gm.id === id);
        exists
          ? (state.messages[index] = action.payload.data)
          : state.messages.push(action.payload.data);
      })
      .addCase(deleteGroupMessageThunk.fulfilled, (state, action) => {

        const { data } = action.payload;
        const groupMessages = state.messages.find(
          (gm) => gm.id === data.groupId
        );
        if (!groupMessages) return;
        const messageIndex = groupMessages.messages.findIndex(
          (m) => m.id === data.messageId
        );
        if (messageIndex !== -1) {
          groupMessages.messages.splice(messageIndex, 1);
        }
      });
  },
});

const selectGroupMessages = (state: RootState) => state.groupMessages.messages;
const selectGroupMessageId = (state: RootState, id: string) => id;

export const selectGroupMessage = createSelector(
  [selectGroupMessages, selectGroupMessageId],
  (groupMessages, id) => groupMessages.find((gm) => gm.id === id)
);

export const { addGroupMessage, addOptimisticGroupMessage, removeOptimisticGroupMessage, editGroupMessage } = groupMessagesSlice.actions;

export default groupMessagesSlice.reducer;
