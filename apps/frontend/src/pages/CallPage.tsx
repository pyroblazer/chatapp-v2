import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  StreamCall,
  StreamTheme,
  SpeakerLayout,
  CallControls,
  CallingState,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { useStreamClient } from '../context/StreamContext';
import { clearActiveCall } from '../store/call/callSlice';
import { AppDispatch, RootState } from '../store';
import { SocketContext } from '../utils/context/SocketContext';
import { useContext } from 'react';

const CallPageInner = ({ onLeave, onLeft }: { onLeave: () => void; onLeft: () => void }) => {
  const { useParticipants, useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participants = useParticipants();

  useEffect(() => {
    if (callingState === CallingState.LEFT) {
      onLeft();
      window.close();
    }
  }, [callingState]);
  const count = participants.length;
  const hadMultipleRef = useRef(false);
  // seconds alone; null means not alone yet
  const [aloneSeconds, setAloneSeconds] = useState<number | null>(null);
  const aloneIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (count > 1) {
      hadMultipleRef.current = true;
      // someone rejoined — reset
      if (aloneIntervalRef.current) {
        clearInterval(aloneIntervalRef.current);
        aloneIntervalRef.current = null;
      }
      setAloneSeconds(null);
    } else if (count === 1 && hadMultipleRef.current && !aloneIntervalRef.current) {
      setAloneSeconds(0);
      aloneIntervalRef.current = setInterval(() => {
        setAloneSeconds((s) => (s ?? 0) + 1);
      }, 1000);
    }
  }, [count]);

  useEffect(() => {
    if (aloneSeconds !== null && aloneSeconds >= 30) {
      if (aloneIntervalRef.current) clearInterval(aloneIntervalRef.current);
      onLeave();
    }
  }, [aloneSeconds]);

  useEffect(() => {
    return () => {
      if (aloneIntervalRef.current) clearInterval(aloneIntervalRef.current);
    };
  }, []);

  const showWarning = aloneSeconds !== null && aloneSeconds >= 15;
  const countdown = aloneSeconds !== null ? Math.max(0, 30 - aloneSeconds) : 0;

  return (
    <>
      <SpeakerLayout />
      <CallControls onLeaveCall={onLeave} />
      {showWarning && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
          }}
        >
          <div
            style={{
              background: '#1e1e2e',
              borderRadius: '16px',
              padding: '40px',
              textAlign: 'center',
              color: 'white',
              minWidth: '360px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📞</div>
            <h2 style={{ marginBottom: '12px', fontSize: '22px' }}>Everyone else has left</h2>
            <p style={{ color: '#aaa', marginBottom: '8px', fontSize: '15px' }}>
              You are the only one remaining in this call.
            </p>
            <p style={{ color: '#e74c3c', marginBottom: '32px', fontSize: '20px', fontWeight: '700' }}>
              Call ending in {countdown}s
            </p>
            <button
              onClick={onLeave}
              style={{
                padding: '12px 32px',
                background: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
              }}
            >
              End Call
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const CallPage = () => {
  const { callId } = useParams<{ callId: string }>();
  const client = useStreamClient();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const socket = useContext(SocketContext);
  const [call] = useState(callId ? client.call('default', callId) : null);
  const [hasJoined, setHasJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLeavingRef = useRef(false);
  const hasJoinedRef = useRef(false);
  const forcedEndRef = useRef(false);

  useEffect(() => {
    if (!callId || !call) {
      setError('Invalid call ID');
      return;
    }

    let mounted = true;
    isLeavingRef.current = false;

    const joinCall = async () => {
      try {
        await call.join({ create: true });
        if (mounted) {
          hasJoinedRef.current = true;
          setHasJoined(true);
        }
      } catch (err) {
        console.error('Failed to join call:', err);
        if (mounted) {
          setError('Failed to join call. The call may have ended.');
        }
      }
    };

    const handleCallRejected = (data: { callId: string; recipientId: string }) => {
      if (data.callId === callId) {
        leaveCall();
      }
    };

    const handleForceEnded = () => {
      forcedEndRef.current = true;
      leaveCall();
    };

    joinCall();
    socket.on('streamCallRejected', handleCallRejected);
    socket.on('onCallForceEnded', handleForceEnded);

    return () => {
      mounted = false;
      socket.off('streamCallRejected', handleCallRejected);
      socket.off('onCallForceEnded', handleForceEnded);
      if (call && hasJoinedRef.current && !isLeavingRef.current) {
        call.leave().catch((err) => {
          console.log('Cleanup: error leaving call', err.message);
        });
      }
    };
  }, [callId, socket]);

  const leaveCall = async () => {
    if (isLeavingRef.current) return;
    isLeavingRef.current = true;

    try {
      if (call) {
        await call.leave().catch((err) => {
          console.log('Call already left or ended:', err.message);
        });
      }
    } catch (err) {
      console.log('Error leaving call:', err);
    } finally {
      dispatch(clearActiveCall());
      setTimeout(() => {
        window.close();
      }, 100);
    }
  };

  if (error) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1a1a1a',
          color: 'white',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <h2>{error}</h2>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '12px 24px',
            background: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1a1a1a',
          color: 'white',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div style={{ fontSize: '24px' }}>Joining call...</div>
        <button
          onClick={leaveCall}
          style={{
            padding: '12px 24px',
            background: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <StreamTheme>
        <StreamCall call={call!}>
          <CallPageInner onLeave={leaveCall} onLeft={() => { if (!forcedEndRef.current) socket.emit('streamCallEnded'); }} />
        </StreamCall>
      </StreamTheme>
    </div>
  );
};
