import { useEffect, useState } from 'react';
import { SocketContext } from '../../context/SocketContext';
import { AuthContext } from '../../context/AuthContext';
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
  const { user } = useContext(AuthContext);
  const [incomingCall, setIncomingCall] = useState<StreamCallPayload | null>(null);

  useEffect(() => {
    const handleStreamCallInitiated = (payload: StreamCallPayload) => {
      // Check if this call is for the current user
      if (!user || payload.recipientId !== user.id) {
        return;
      }

      // Show incoming call dialog (dialog handles ringtone)
      setIncomingCall(payload);
    };

    socket.on('streamCallInitiated', handleStreamCallInitiated);

    return () => {
      socket.off('streamCallInitiated', handleStreamCallInitiated);
    };
  }, [socket, user]);

  const handleCloseDialog = () => {
    setIncomingCall(null);
  };

  const IncomingCallUI = incomingCall
    ? React.createElement(IncomingCallDialog, { payload: incomingCall, onClose: handleCloseDialog })
    : null;

  return { IncomingCallUI };
};
