import { useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../../../store';
import {
  setCaller,
  setReceiver,
  setIsReceivingCall,
  setCallType,
  setCallError,
  setIsCallInProgress,
} from '../../../../store/call/callSlice';
import { AuthContext } from '../../../context/AuthContext';
import { SocketContext } from '../../../context/SocketContext';
import { CallPayload } from '../../../types';

export function useVideoCall() {
  const socket = useContext(SocketContext);
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useContext(AuthContext);
  const { isReceivingCall } = useSelector((state: RootState) => state.call);
  const navigate = useNavigate();

  useEffect(() => {
    socket.on('onVideoCall', (data: CallPayload) => {
      if (isReceivingCall) return;
      dispatch(setCaller(data.caller));
      dispatch(setReceiver(user!));
      dispatch(setIsReceivingCall(true));
      dispatch(setCallType('video'));

      // Navigate to the conversation when receiving a call
      if (data.conversationId) {
        navigate(`/conversations/${data.conversationId}`);
      }
    });

    socket.on('onVideoCallError', (error: { message: string }) => {
      dispatch(setCallError(error.message));
      dispatch(setIsReceivingCall(false));
      dispatch(setIsCallInProgress(false));
    });

    return () => {
      socket.off('onVideoCall');
      socket.off('onVideoCallError');
    };
  }, [isReceivingCall, navigate]);
}
