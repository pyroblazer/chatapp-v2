import React, { useEffect, useState, useRef } from 'react';
import { SocketContext } from '../../utils/context/SocketContext';
import { useContext } from 'react';
import { FaVideo, FaPhone, FaPhoneSlash } from 'react-icons/fa';

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
  const socket = useContext(SocketContext);
  const [timeLeft, setTimeLeft] = useState(30);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Play ringtone
    try {
      ringtoneRef.current = new Audio('/sounds/ringtone.mp3');
      ringtoneRef.current.loop = true;
      ringtoneRef.current.play().catch((err) => console.log('Could not play ringtone:', err));
    } catch (err) {
      console.log('Ringtone not available:', err);
    }

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

    return () => {
      clearInterval(timer);
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current = null;
      }
    };
  }, []);

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current = null;
    }
  };

  const handleAccept = async () => {
    stopRingtone();

    // Notify caller that we accepted
    socket.emit('streamCallAccepted', {
      callId: payload.callId,
      recipientId: payload.recipientId,
    });

    // Open call in new browser tab
    const callUrl = `${window.location.origin}/call/${payload.callId}`;
    window.open(callUrl, '_blank', 'noopener,noreferrer');

    onClose();
  };

  const handleReject = () => {
    stopRingtone();

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
        background: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        animation: 'fadeIn 0.3s ease-in',
      }}
    >
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          .pulse-animation {
            animation: pulse 2s ease-in-out infinite;
          }
        `}
      </style>
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)',
          padding: '50px',
          borderRadius: '24px',
          textAlign: 'center',
          color: 'white',
          minWidth: '500px',
          maxWidth: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Call Icon */}
        <div style={{ marginBottom: '30px' }} className="pulse-animation">
          {payload.callType === 'video' ? (
            <FaVideo size={80} color="#3498db" />
          ) : (
            <FaPhone size={80} color="#3498db" />
          )}
        </div>

        {/* Call Type */}
        <h2
          style={{
            marginBottom: '15px',
            fontSize: '28px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          Incoming {payload.callType} Call
        </h2>

        {/* Caller Name */}
        <p
          style={{
            marginBottom: '10px',
            fontSize: '24px',
            fontWeight: '500',
          }}
        >
          {payload.callerName}
        </p>

        {/* Calling... text */}
        <p
          style={{
            marginBottom: '30px',
            color: '#aaa',
            fontSize: '16px',
          }}
        >
          is calling you...
        </p>

        {/* Timer */}
        <div
          style={{
            marginBottom: '40px',
            padding: '10px 20px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            display: 'inline-block',
          }}
        >
          <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
            {timeLeft}s
          </span>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '30px',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Decline Button */}
          <button
            onClick={handleReject}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              boxShadow: '0 4px 15px rgba(231, 76, 60, 0.4)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <FaPhoneSlash size={32} />
          </button>

          {/* Accept Button */}
          <button
            onClick={handleAccept}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#27ae60',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              boxShadow: '0 4px 15px rgba(39, 174, 96, 0.4)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <FaPhone size={32} style={{ transform: 'rotate(135deg)' }} />
          </button>
        </div>

        {/* Labels */}
        <div
          style={{
            marginTop: '20px',
            display: 'flex',
            gap: '80px',
            justifyContent: 'center',
            fontSize: '14px',
            color: '#aaa',
          }}
        >
          <span>Decline</span>
          <span>Accept</span>
        </div>
      </div>
    </div>
  );
};
