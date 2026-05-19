import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStreamClient } from '../../context/StreamContext';
import { SocketContext } from '../../utils/context/SocketContext';
import { useContext } from 'react';

interface IncomingCallPayload {
  callId: string;
  callType: 'video' | 'audio';
  callerId: string;
  callerName: string;
  recipientId: string;
  conversationId: string;
}

interface IncomingCallDialogProps {
  payload: IncomingCallPayload;
  onClose: () => void;
}

export const IncomingCallDialog: React.FC<IncomingCallDialogProps> = ({ payload, onClose }) => {
  const navigate = useNavigate();
  const socket = useContext(SocketContext);
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleReject();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAccept = async () => {
    // Notify caller that we accepted
    socket.emit('streamCallAccepted', {
      callId: payload.callId,
      recipientId: payload.recipientId,
    });

    // Navigate to the call page
    navigate(`/call/${payload.callId}`, { replace: false });
    onClose();
  };

  const handleReject = () => {
    // Notify caller that we rejected
    socket.emit('streamCallRejected', {
      callId: payload.callId,
      recipientId: payload.recipientId,
    });

    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
    >
      <div
        style={{
          background: '#272a30',
          padding: '40px',
          borderRadius: '16px',
          textAlign: 'center',
          color: 'white',
          minWidth: '400px',
        }}
      >
        <h2 style={{ marginBottom: '20px' }}>
          Incoming {payload.callType} call
        </h2>
        <p style={{ marginBottom: '10px', fontSize: '18px' }}>
          {payload.callerName} is calling you...
        </p>
        <p style={{ marginBottom: '30px', color: '#aaa' }}>
          {timeLeft}s remaining
        </p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <button
            onClick={handleReject}
            style={{
              padding: '12px 30px',
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            style={{
              padding: '12px 30px',
              background: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};
