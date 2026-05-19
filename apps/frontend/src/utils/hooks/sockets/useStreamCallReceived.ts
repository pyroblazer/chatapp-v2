import { useEffect, useState } from 'react';
import { SocketContext } from '../../context/SocketContext';
import { useContext } from 'react';
import { IncomingCallDialog } from '../../../components/calls/IncomingCallDialog';

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
  const [incomingCall, setIncomingCall] = useState<StreamCallPayload | null>(null);

  useEffect(() => {
    const handleStreamCallInitiated = (payload: StreamCallPayload) => {
      // Check if this call is for the current user
      const currentUserId = localStorage.getItem('userId');
      if (payload.recipientId !== currentUserId) {
        return;
      }

      // Show incoming call dialog
      setIncomingCall(payload);
    };

    socket.on('streamCallInitiated', handleStreamCallInitiated);

    return () => {
      socket.off('streamCallInitiated', handleStreamCallInitiated);
    };
  }, [socket]);

  const handleCloseDialog = () => {
    setIncomingCall(null);
  };

  const IncomingCallUI = incomingCall
    ? React.createElement(IncomingCallDialog, { payload: incomingCall, onClose: handleCloseDialog })
    : null;

  return { IncomingCallUI };
};
