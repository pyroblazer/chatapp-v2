import React, { useEffect, useState } from 'react';
import { FaVideo, FaPhone, FaPhoneSlash } from 'react-icons/fa';

interface WaitingCallDialogProps {
  recipientName: string;
  callType: 'video' | 'audio';
  callId: string;
  initiatedAt?: number;
  onCancel: () => void;
}

const CALL_TIMEOUT = 10;

export const WaitingCallDialog: React.FC<WaitingCallDialogProps> = ({
  recipientName,
  callType,
  callId,
  initiatedAt,
  onCancel,
}) => {
  const getElapsed = () =>
    initiatedAt ? Math.floor((Date.now() - initiatedAt) / 1000) : 0;

  const [elapsed, setElapsed] = useState(getElapsed);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = getElapsed();
      if (next >= CALL_TIMEOUT) {
        clearInterval(timer);
        onCancel();
        return;
      }
      setElapsed(next);
    }, 1000);

    return () => clearInterval(timer);
  }, [initiatedAt]);

  const timeLeft = Math.max(0, CALL_TIMEOUT - elapsed);

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
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
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
          {callType === 'video' ? (
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
          {callType} Call
        </h2>

        {/* Calling... text */}
        <p
          style={{
            marginBottom: '10px',
            fontSize: '24px',
            fontWeight: '500',
          }}
        >
          Calling {recipientName}...
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

        {/* Cancel Button */}
        <div
          style={{
            display: 'flex',
            gap: '30px',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <button
            onClick={onCancel}
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
        </div>

        {/* Label */}
        <div
          style={{
            marginTop: '20px',
            fontSize: '14px',
            color: '#aaa',
          }}
        >
          <span>Cancel</span>
        </div>
      </div>
    </div>
  );
};
