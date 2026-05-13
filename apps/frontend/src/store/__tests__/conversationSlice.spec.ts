import conversationsReducer, {
  addConversation,
  updateConversation,
  fetchConversationsThunk,
  createConversationThunk,
  type ConversationsState,
} from '../conversationSlice';
import { Conversation } from '../../utils/types';

const mockConversation: Conversation = {
  id: 1,
  creator: {
    id: 1,
    username: 'alice',
    email: 'alice@test.com',
    status: 'online',
    createdAt: new Date().toString(),
    profile: undefined,
  },
  recipient: {
    id: 2,
    username: 'bob',
    email: 'bob@test.com',
    status: 'offline',
    createdAt: new Date().toString(),
    profile: undefined,
  },
  createdAt: new Date().toString(),
  lastMessageSent: {
    id: 1,
    content: 'Hello',
    createdAt: new Date().toString(),
    conversation: undefined,
    author: undefined,
  },
};

describe('conversationSlice', () => {
  it('should have empty conversations and loading false in initial state', () => {
    const result = conversationsReducer(undefined, { type: 'unknown' });
    expect(result).toEqual({ conversations: [], loading: false });
  });

  it('should populate conversations via fetchConversationsThunk.fulfilled', () => {
    const action = {
      type: fetchConversationsThunk.fulfilled.type,
      payload: { data: [mockConversation] },
    };
    const result = conversationsReducer(undefined, action);
    expect(result.conversations).toHaveLength(1);
    expect(result.conversations[0].id).toBe(1);
    expect(result.loading).toBe(false);
  });

  it('should set loading to true on fetchConversationsThunk.pending', () => {
    const action = { type: fetchConversationsThunk.pending.type };
    const result = conversationsReducer(undefined, action);
    expect(result.loading).toBe(true);
  });

  it('should prepend a conversation via createConversationThunk.fulfilled', () => {
    const state: ConversationsState = {
      conversations: [],
      loading: false,
    };
    const action = {
      type: createConversationThunk.fulfilled.type,
      payload: { data: mockConversation },
    };
    const result = conversationsReducer(state, action);
    expect(result.conversations).toHaveLength(1);
    expect(result.conversations[0].id).toBe(1);
  });

  it('should add a conversation via addConversation', () => {
    const result = conversationsReducer(
      { conversations: [], loading: false },
      addConversation(mockConversation)
    );
    expect(result.conversations).toHaveLength(1);
    expect(result.conversations[0].id).toBe(1);
  });

  it('should move updated conversation to the front via updateConversation', () => {
    const updated = { ...mockConversation, createdAt: 'updated-date' };
    const state: ConversationsState = {
      conversations: [mockConversation],
      loading: false,
    };
    const result = conversationsReducer(state, updateConversation(updated));
    expect(result.conversations).toHaveLength(1);
    expect(result.conversations[0].createdAt).toBe('updated-date');
  });
});
