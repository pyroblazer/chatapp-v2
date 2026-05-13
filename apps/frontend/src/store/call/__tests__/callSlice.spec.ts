import callReducer, {
  setPeer,
  setCall,
  setLocalStream,
  setRemoteStream,
  setIsReceivingCall,
  setIsCalling,
  setIsCallInProgress,
  setCaller,
  setReceiver,
  resetState,
  setActiveConversationId,
  setCallType,
  type CallState,
} from '../callSlice';

describe('callSlice', () => {
  it('should return the correct initial state', () => {
    const result = callReducer(undefined, { type: 'unknown' });
    expect(result).toEqual({
      isCalling: false,
      isCallInProgress: false,
      isReceivingCall: false,
    });
  });

  it('should set peer via setPeer', () => {
    const mockPeer = {} as any;
    const result = callReducer(undefined, setPeer(mockPeer));
    expect(result.peer).toBe(mockPeer);
  });

  it('should set call via setCall', () => {
    const mockCall = {} as any;
    const result = callReducer(undefined, setCall(mockCall));
    expect(result.call).toBe(mockCall);
  });

  it('should set localStream via setLocalStream', () => {
    const mockStream = {} as any;
    const result = callReducer(undefined, setLocalStream(mockStream));
    expect(result.localStream).toBe(mockStream);
  });

  it('should set remoteStream via setRemoteStream', () => {
    const mockStream = {} as any;
    const result = callReducer(undefined, setRemoteStream(mockStream));
    expect(result.remoteStream).toBe(mockStream);
  });

  it('should set isReceivingCall via setIsReceivingCall', () => {
    const result = callReducer(undefined, setIsReceivingCall(true));
    expect(result.isReceivingCall).toBe(true);
  });

  it('should set isCalling via setIsCalling', () => {
    const result = callReducer(undefined, setIsCalling(true));
    expect(result.isCalling).toBe(true);
  });

  it('should set isCallInProgress and clear isCalling via setIsCallInProgress', () => {
    const state: CallState = {
      isCalling: true,
      isCallInProgress: false,
      isReceivingCall: false,
    };
    const result = callReducer(state, setIsCallInProgress(true));
    expect(result.isCallInProgress).toBe(true);
    expect(result.isCalling).toBe(false);
  });

  it('should set caller via setCaller', () => {
    const mockUser = { id: 1, username: 'alice' } as any;
    const result = callReducer(undefined, setCaller(mockUser));
    expect(result.caller).toBe(mockUser);
  });

  it('should set receiver via setReceiver', () => {
    const mockUser = { id: 2, username: 'bob' } as any;
    const result = callReducer(undefined, setReceiver(mockUser));
    expect(result.receiver).toBe(mockUser);
  });

  it('should set activeConversationId', () => {
    const result = callReducer(undefined, setActiveConversationId(42));
    expect(result.activeConversationId).toBe(42);
  });

  it('should set callType', () => {
    const result = callReducer(undefined, setCallType('video'));
    expect(result.callType).toBe('video');
  });

  it('should reset all call state via resetState (except peer)', () => {
    const mockPeer = { id: 'test-peer' } as any;
    const state: CallState = {
      isCalling: true,
      isCallInProgress: true,
      isReceivingCall: true,
      caller: {} as any,
      receiver: {} as any,
      peer: mockPeer,
      call: {} as any,
      connection: {} as any,
      remoteStream: {} as any,
      localStream: {} as any,
      activeConversationId: 5,
      callType: 'audio',
    };
    const result = callReducer(state, resetState());
    // resetState does NOT clear peer
    expect(result.peer).toBe(mockPeer);
    expect(result.isCalling).toBe(false);
    expect(result.isCallInProgress).toBe(false);
    expect(result.isReceivingCall).toBe(false);
    expect(result.caller).toBeUndefined();
    expect(result.receiver).toBeUndefined();
    expect(result.call).toBeUndefined();
    expect(result.connection).toBeUndefined();
    expect(result.remoteStream).toBeUndefined();
    expect(result.localStream).toBeUndefined();
    expect(result.activeConversationId).toBeUndefined();
    expect(result.callType).toBeUndefined();
  });
});
