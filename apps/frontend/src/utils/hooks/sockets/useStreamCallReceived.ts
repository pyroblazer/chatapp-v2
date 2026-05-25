import React, { useEffect, useState } from 'react';
import { SocketContext } from '../../context/SocketContext';
import { AuthContext } from '../../context/AuthContext';
import { IncomingCallDialog } from '../../../components/calls/IncomingCallDialog';

interface StreamCallPayload {
  callId: string;
  callType: 'video' | 'audio';
  callerId: string;
  callerName: string;
  recipientId?: string;
  conversationId?: string;
  groupId?: string;
  initiatedAt?: number;
}

export const useStreamCallReceived = () => {
  const socket = React.useContext(SocketContext);
  const { user } = React.useContext(AuthContext);
  const [incomingCall, setIncomingCall] = useState<StreamCallPayload | null>(null);

  useEffect(() => {
    const handleStreamCallInitiated = (payload: StreamCallPayload) => {
      // For group calls, groupId is present — always show dialog
      // For 1-to-1 calls, recipientId must match current user
      const isForMe = payload.groupId || payload.recipientId === user?.id;
      if (!user || !isForMe) return;

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
