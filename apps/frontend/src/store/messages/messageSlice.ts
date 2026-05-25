import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '..';
import {
  ConversationMessage,
  DeleteMessageResponse,
  MessageEventPayload,
  MessageType,
} from '../../utils/types';
import { deleteMessageThunk, editMessageThunk, fetchMessagesThunk } from './messageThunk';

export interface MessagesState {
  messages: ConversationMessage[];
  loading: boolean;
}

const initialState: MessagesState = {
  messages: [],
  loading: false,
};

export const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<MessageEventPayload>) => {
      const { conversation, message } = action.payload;
      const conversationMessage = state.messages.find((cm) => cm.id === conversation.id);
      if (!conversationMessage) return;
      // Replace optimistic message if one exists from the same author
      const pendingIndex = conversationMessage.messages.findIndex(
        (m) => m._pending && m.author?.id === message.author?.id && m.content === message.content
      );
      if (pendingIndex !== -1) {
        conversationMessage.messages[pendingIndex] = message;
      } else {
        conversationMessage.messages.unshift(message);
      }
    },
    addOptimisticMessage: (state, action: PayloadAction<MessageType>) => {
      const message = action.payload;
      const conversationId = message.conversation?.id;
      if (!conversationId) return;
      let conversationMessage = state.messages.find((cm) => cm.id === conversationId);
      if (!conversationMessage) {
        conversationMessage = { id: conversationId, messages: [] };
        state.messages.push(conversationMessage);
      }
      conversationMessage.messages.unshift(message);
    },
    removeOptimisticMessage: (state, action: PayloadAction<{ conversationId: string; tempId: string }>) => {
      const { conversationId, tempId } = action.payload;
      const conversationMessage = state.messages.find((cm) => cm.id === conversationId);
      if (!conversationMessage) return;
      const index = conversationMessage.messages.findIndex((m) => m.id === tempId);
      if (index !== -1) {
        conversationMessage.messages.splice(index, 1);
      }
    },
    deleteMessage: (state, action: PayloadAction<DeleteMessageResponse>) => {
      const { payload } = action;
      const conversationMessages = state.messages.find((cm) => cm.id === payload.conversationId);
      if (!conversationMessages) return;
      const messageIndex = conversationMessages.messages.findIndex(
        (m) => m.id === payload.messageId
      );
      if (messageIndex !== -1) {
        conversationMessages.messages.splice(messageIndex, 1);
      }
    },
    editMessage: (state, action: PayloadAction<MessageType>) => {
      const message = action.payload;
      const conversationMessage = state.messages.find((cm) => cm.id === message.conversation.id);
      if (!conversationMessage) return;
      const messageIndex = conversationMessage.messages.findIndex((m) => m.id === message.id);
      conversationMessage.messages[messageIndex] = message;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessagesThunk.fulfilled, (state, action) => {
        const { id, messages } = action.payload.data;
        const index = state.messages.findIndex((cm) => cm.id === id);
        const exists = state.messages.find((cm) => cm.id === id);
        if (exists) {
          state.messages[index] = action.payload.data;
        } else {
          state.messages.push(action.payload.data);
        }
      })
      .addCase(deleteMessageThunk.fulfilled, (state, action) => {
        const { data } = action.payload;
        const conversationMessages = state.messages.find((cm) => cm.id === data.conversationId);
        if (!conversationMessages) return;
        const messageIndex = conversationMessages.messages.findIndex(
          (m) => m.id === data.messageId
        );
        if (messageIndex !== -1) {
          conversationMessages.messages.splice(messageIndex, 1);
        }
      })
      .addCase(editMessageThunk.fulfilled, (state, action) => {
        const { data: message } = action.payload;
        const { id } = message.conversation;
        const conversationMessage = state.messages.find((cm) => cm.id === id);
        if (!conversationMessage) return;
        const messageIndex = conversationMessage.messages.findIndex((m) => m.id === message.id);
        conversationMessage.messages[messageIndex] = message;
      });
  },
});

const selectConversationMessages = (state: RootState) => state.messages.messages;

const selectConversationMessageId = (state: RootState, id: string) => id;

export const selectConversationMessage = createSelector(
  [selectConversationMessages, selectConversationMessageId],
  (conversationMessages, id) => conversationMessages.find((cm) => cm.id === id)
);

export const { addMessage, addOptimisticMessage, removeOptimisticMessage, deleteMessage, editMessage } = messagesSlice.actions;

export default messagesSlice.reducer;
