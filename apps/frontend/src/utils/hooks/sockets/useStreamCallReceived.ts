import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { SocketContext } from '../../context/SocketContext';
import { useContext } from 'react';
import { setActiveCall } from '../../../store/call/callSlice';
import { useToast } from '../useToast';

interface StreamCallPayload {
  callId: string;
  callType: 'video' | 'audio';
  callerId: string;
  callerName: string;
  recipientId: string;
  conversationId: string;
}

export const useStreamCallReceived = () => {
  const socket = useContext(SocketContext);
  const dispatch = useDispatch();
  const { info, warning } = useToast({ theme: 'dark' });

  useEffect(() => {
    const handleStreamCallInitiated = (payload: StreamCallPayload) => {
      // Check if this call is for the current user
      const currentUserId = localStorage.getItem('userId');
      if (payload.recipientId !== currentUserId) {
        return;
      }

      // Show incoming call notification
      info(
        `Incoming ${payload.callType} call from ${payload.callerName}`,
        {
          position: 'top-center',
          duration: 30000, // Show for 30 seconds (same as call timeout)
          onClick: () => {
            // Join the call when notification is clicked
            dispatch(setActiveCall({ callId: payload.callId, callType: payload.callType }));
          },
        }
      );

      // Auto-join the call
      dispatch(setActiveCall({ callId: payload.callId, callType: payload.callType }));
    };

    socket.on('streamCallInitiated', handleStreamCallInitiated);

    return () => {
      socket.off('streamCallInitiated', handleStreamCallInitiated);
    };
  }, [socket, dispatch, info, warning]);
};
