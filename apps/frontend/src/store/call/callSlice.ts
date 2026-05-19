import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CallState {
  activeCallId?: string;
  callType?: 'video' | 'audio';
  isInCall: boolean;
}

const initialState: CallState = {
  isInCall: false,
};

export const callSlice = createSlice({
  name: 'callSlice',
  initialState,
  reducers: {
    setActiveCall: (state, action: PayloadAction<{ callId: string; callType: 'video' | 'audio' }>) => {
      state.activeCallId = action.payload.callId;
      state.callType = action.payload.callType;
      state.isInCall = true;
    },
    clearActiveCall: (state) => {
      state.activeCallId = undefined;
      state.callType = undefined;
      state.isInCall = false;
    },
  },
});

export const { setActiveCall, clearActiveCall } = callSlice.actions;
export default callSlice.reducer;
