import unreadReducer, {
  setConversationUnread,
  clearConversationUnread,
  incrementConversationUnread,
  clearGroupUnread,
  incrementGroupUnread,
  fetchAllConversationUnreadCountsThunk,
  selectTotalUnreadConversations,
  selectTotalUnreadGroups,
  selectTotalUnread,
  UnreadState,
} from '../unreadSlice';
import { RootState } from '../index';

describe('unreadSlice', () => {
  const initialState: UnreadState = {
    conversationCounts: {},
    groupCounts: {},
  };

  it('should return the initial state', () => {
    expect(unreadReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setConversationUnread', () => {
    it('should set count for specific conversation', () => {
      const action = setConversationUnread({ id: 'conv-1', count: 5 });
      const state = unreadReducer(initialState, action);
      expect(state.conversationCounts['conv-1']).toBe(5);
    });

    it('should overwrite existing count', () => {
      const existingState = {
        conversationCounts: { 'conv-1': 3 },
        groupCounts: {},
      };
      const action = setConversationUnread({ id: 'conv-1', count: 7 });
      const state = unreadReducer(existingState, action);
      expect(state.conversationCounts['conv-1']).toBe(7);
    });
  });

  describe('clearConversationUnread', () => {
    it('should set specific conversation count to 0', () => {
      const existingState = {
        conversationCounts: { 'conv-1': 5, 'conv-2': 3 },
        groupCounts: {},
      };
      const action = clearConversationUnread('conv-1');
      const state = unreadReducer(existingState, action);
      expect(state.conversationCounts['conv-1']).toBe(0);
      expect(state.conversationCounts['conv-2']).toBe(3);
    });

    it('should handle non-existent conversation', () => {
      const action = clearConversationUnread('conv-999');
      const state = unreadReducer(initialState, action);
      expect(state.conversationCounts['conv-999']).toBe(0);
    });
  });

  describe('incrementConversationUnread', () => {
    it('should increment from 0 to 1', () => {
      const action = incrementConversationUnread('conv-1');
      const state = unreadReducer(initialState, action);
      expect(state.conversationCounts['conv-1']).toBe(1);
    });

    it('should increment existing count', () => {
      const existingState = {
        conversationCounts: { 'conv-1': 5 },
        groupCounts: {},
      };
      const action = incrementConversationUnread('conv-1');
      const state = unreadReducer(existingState, action);
      expect(state.conversationCounts['conv-1']).toBe(6);
    });

    it('should create key if missing', () => {
      const action = incrementConversationUnread('new-conv');
      const state = unreadReducer(initialState, action);
      expect(state.conversationCounts['new-conv']).toBe(1);
    });
  });

  describe('clearGroupUnread', () => {
    it('should set specific group count to 0', () => {
      const existingState = {
        conversationCounts: {},
        groupCounts: { 'group-1': 5, 'group-2': 3 },
      };
      const action = clearGroupUnread('group-1');
      const state = unreadReducer(existingState, action);
      expect(state.groupCounts['group-1']).toBe(0);
      expect(state.groupCounts['group-2']).toBe(3);
    });
  });

  describe('incrementGroupUnread', () => {
    it('should increment from 0 to 1', () => {
      const action = incrementGroupUnread('group-1');
      const state = unreadReducer(initialState, action);
      expect(state.groupCounts['group-1']).toBe(1);
    });

    it('should increment existing count', () => {
      const existingState = {
        conversationCounts: {},
        groupCounts: { 'group-1': 5 },
      };
      const action = incrementGroupUnread('group-1');
      const state = unreadReducer(existingState, action);
      expect(state.groupCounts['group-1']).toBe(6);
    });
  });

  describe('fetchAllConversationUnreadCountsThunk', () => {
    it('should merge payload into conversationCounts on fulfillment', () => {
      const existingState = {
        conversationCounts: { 'conv-old': 2 },
        groupCounts: {},
      };
      const payload = { 'conv-1': 5, 'conv-2': 3 };
      const action = {
        type: fetchAllConversationUnreadCountsThunk.fulfilled.type,
        payload,
      };
      const state = unreadReducer(existingState, action);
      expect(state.conversationCounts).toEqual({
        'conv-old': 2,
        'conv-1': 5,
        'conv-2': 3,
      });
    });
  });
});

describe('unreadSlice selectors', () => {
  const createState = (
    conversationCounts: Record<string, number> = {},
    groupCounts: Record<string, number> = {}
  ): RootState => ({
    unread: { conversationCounts, groupCounts },
  } as any);

  describe('selectTotalUnreadConversations', () => {
    it('should return 0 for empty state', () => {
      const state = createState();
      expect(selectTotalUnreadConversations(state)).toBe(0);
    });

    it('should sum all conversation counts', () => {
      const state = createState({ 'conv-1': 5, 'conv-2': 3, 'conv-3': 0 });
      expect(selectTotalUnreadConversations(state)).toBe(8);
    });

    it('should handle negative values', () => {
      const state = createState({ 'conv-1': -1, 'conv-2': 5 });
      expect(selectTotalUnreadConversations(state)).toBe(4);
    });
  });

  describe('selectTotalUnreadGroups', () => {
    it('should return 0 for empty state', () => {
      const state = createState();
      expect(selectTotalUnreadGroups(state)).toBe(0);
    });

    it('should sum all group counts', () => {
      const state = createState({}, { 'group-1': 5, 'group-2': 3 });
      expect(selectTotalUnreadGroups(state)).toBe(8);
    });
  });

  describe('selectTotalUnread', () => {
    it('should sum both conversation and group counts', () => {
      const state = createState(
        { 'conv-1': 5, 'conv-2': 3 },
        { 'group-1': 2, 'group-2': 4 }
      );
      expect(selectTotalUnread(state)).toBe(14);
    });

    it('should return 0 for empty state', () => {
      const state = createState();
      expect(selectTotalUnread(state)).toBe(0);
    });
  });
});
