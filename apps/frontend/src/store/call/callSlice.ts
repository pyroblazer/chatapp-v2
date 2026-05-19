import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CallState {
  activeCallId?: string;
  callType?: 'video' | 'audio';
}

const initialState: CallState = {};

export const callSlice = createSlice({
  name: 'callSlice',
  initialState,
  reducers: {
    setActiveCall: (state, action: PayloadAction<{ callId: string; callType: 'video' | 'audio' }>) => {
      state.activeCallId = action.payload.callId;
      state.callType = action.payload.callType;
    },
    clearActiveCall: (state) => {
      state.activeCallId = undefined;
      state.callType = undefined;
    },
  },
});

export const { setActiveCall, clearActiveCall } = callSlice.actions;
export default callSlice.reducer;
