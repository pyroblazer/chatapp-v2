import React, { useEffect, useRef, useState } from 'react';
import { SocketContext } from '../../context/SocketContext';
import { WaitingCallDialog } from '../../../components/calls/WaitingCallDialog';

interface WaitingCallState {
  callId: string;
  recipientId: string;
  recipientName: string;
  callType: 'video' | 'audio';
  initiatedAt: number;
  groupId?: string;
}

export const useStreamCallWaiting = () => {
  const socket = React.useContext(SocketContext);
  const [waitingCall, setWaitingCall] = useState<WaitingCallState | null>(null);
  const [busyMessage, setBusyMessage] = useState<string | null>(null);
  // Ref mirrors waitingCall so socket callbacks always see the latest value
  // without stale closures, and so cancelWaiting/accept can't both fire.
  const waitingCallRef = useRef<WaitingCallState | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    const handleCallAccepted = (payload: { callId: string }) => {
      const current = waitingCallRef.current;
      if (!current || current.callId !== payload.callId) return;
      if (handledRef.current) return;
      handledRef.current = true;
      const callUrl = `${window.location.origin}/call/${payload.callId}`;
      window.open(callUrl, '_blank', 'noopener,noreferrer');
      waitingCallRef.current = null;
      setWaitingCall(null);
    };

    const handleCallRejected = (payload: { callId: string }) => {
      const current = waitingCallRef.current;
      if (!current || current.callId !== payload.callId) return;
      if (handledRef.current) return;
      handledRef.current = true;
      waitingCallRef.current = null;
      setWaitingCall(null);
    };

    const handleUserBusy = () => {
      if (!waitingCallRef.current || handledRef.current) return;
      handledRef.current = true;
      waitingCallRef.current = null;
      setWaitingCall(null);
      setBusyMessage('That person is currently in another call.');
    };

    socket.on('streamCallAccepted', handleCallAccepted);
    socket.on('streamCallRejected', handleCallRejected);
    socket.on('onUserBusy', handleUserBusy);

    return () => {
      socket.off('streamCallAccepted', handleCallAccepted);
      socket.off('streamCallRejected', handleCallRejected);
      socket.off('onUserBusy', handleUserBusy);
    };
  }, [socket]);

  const startWaiting = (callInfo: WaitingCallState) => {
    handledRef.current = false;
    waitingCallRef.current = callInfo;
    setWaitingCall(callInfo);
  };

  const cancelWaiting = () => {
    const current = waitingCallRef.current;
    if (!current) return;
    if (handledRef.current) return;
    handledRef.current = true;
    if (current.groupId) {
      socket.emit('streamGroupCallCancelled', {
        callId: current.callId,
        groupId: current.groupId,
      });
    } else {
      socket.emit('streamCallCancelled', {
        callId: current.callId,
        recipientId: current.recipientId,
      });
    }
    waitingCallRef.current = null;
    setWaitingCall(null);
  };

  const WaitingCallUI = waitingCall
    ? React.createElement(WaitingCallDialog, {
        recipientName: waitingCall.recipientName,
        callType: waitingCall.callType,
        callId: waitingCall.callId,
        initiatedAt: waitingCall.initiatedAt,
        onCancel: cancelWaiting,
      })
    : null;

  const BusyUI = busyMessage
    ? React.createElement(
        'div',
        {
          style: {
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
          },
        },
        React.createElement(
          'div',
          {
            style: {
              background: '#1e1e2e',
              borderRadius: '16px',
              padding: '40px',
              textAlign: 'center',
              color: 'white',
              minWidth: '340px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.1)',
            },
          },
          React.createElement('div', { style: { fontSize: '48px', marginBottom: '16px' } }, '📵'),
          React.createElement('h2', { style: { marginBottom: '12px', fontSize: '20px' } }, 'User Busy'),
          React.createElement('p', { style: { color: '#aaa', marginBottom: '28px', fontSize: '15px' } }, busyMessage),
          React.createElement(
            'button',
            {
              onClick: () => setBusyMessage(null),
              style: {
                padding: '10px 28px',
                background: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
              },
            },
            'OK',
          ),
        ),
      )
    : null;

  return { waitingCall, startWaiting, cancelWaiting, WaitingCallUI, BusyUI };
};
