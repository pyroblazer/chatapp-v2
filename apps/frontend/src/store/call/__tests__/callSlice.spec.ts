import callReducer, {
  setActiveCall,
  clearActiveCall,
  type CallState,
} from '../callSlice';

describe('callSlice', () => {
  it('should return the correct initial state', () => {
    const result = callReducer(undefined, { type: 'unknown' });
    expect(result).toEqual({});
  });

  it('should set activeCallId and callType via setActiveCall', () => {
    const result = callReducer(undefined, setActiveCall({ callId: 'abc-123', callType: 'video' }));
    expect(result.activeCallId).toBe('abc-123');
    expect(result.callType).toBe('video');
  });

  it('should clear active call via clearActiveCall', () => {
    const state: CallState = {
      activeCallId: 'abc-123',
      callType: 'audio',
    };
    const result = callReducer(state, clearActiveCall());
    expect(result.activeCallId).toBeUndefined();
    expect(result.callType).toBeUndefined();
  });

  it('should overwrite an existing active call via setActiveCall', () => {
    const state: CallState = {
      activeCallId: 'old-id',
      callType: 'audio',
    };
    const result = callReducer(state, setActiveCall({ callId: 'new-id', callType: 'video' }));
    expect(result.activeCallId).toBe('new-id');
    expect(result.callType).toBe('video');
  });
});
