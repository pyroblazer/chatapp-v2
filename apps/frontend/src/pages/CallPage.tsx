import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  StreamCall,
  StreamTheme,
  SpeakerLayout,
  CallControls,
  CallingState,
} from '@stream-io/video-react-sdk';
import { useStreamClient } from '../context/StreamContext';
import { clearActiveCall } from '../store/call/callSlice';
import { AppDispatch, RootState } from '../store';
import { SocketContext } from '../utils/context/SocketContext';
import { useContext } from 'react';

export const CallPage = () => {
  const { callId } = useParams<{ callId: string }>();
  const client = useStreamClient();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const socket = useContext(SocketContext);
  const [call, setCall] = useState(callId ? client.call('default', callId) : null);
  const [hasJoined, setHasJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLeavingRef = useRef(false);

  useEffect(() => {
    if (!callId || !call) {
      setError('Invalid call ID');
      return;
    }

    let mounted = true;
    isLeavingRef.current = false; // Reset leaving state on new call

    const joinCall = async () => {
      try {
        // Join the call (create if doesn't exist)
        await call.join({ create: true });
        if (mounted) {
          setHasJoined(true);
        }
      } catch (err) {
        console.error('Failed to join call:', err);
        if (mounted) {
          setError('Failed to join call. The call may have ended.');
        }
      }
    };

    // Listen for call rejection
    const handleCallRejected = (data: { callId: string; recipientId: string }) => {
      if (data.callId === callId) {
        console.log('Call was rejected');
        leaveCall();
      }
    };

    joinCall();
    socket.on('streamCallRejected', handleCallRejected);

    return () => {
      mounted = false;
      socket.off('streamCallRejected', handleCallRejected);
      // Cleanup: leave call when component unmounts
      if (call && hasJoined && !isLeavingRef.current) {
        call.leave().catch((err) => {
          console.log('Cleanup: error leaving call', err.message);
        });
      }
    };
  }, [call, callId, socket, hasJoined]);

  const leaveCall = async () => {
    // Prevent multiple leave calls
    if (isLeavingRef.current) {
      return;
    }
    isLeavingRef.current = true;

    try {
      if (call) {
        await call.leave().catch((err) => {
          console.log('Call already left or ended:', err.message);
          // Ignore error, continue with cleanup
        });
      }
    } catch (err) {
      console.log('Error leaving call:', err);
    } finally {
      // Always cleanup and navigate, regardless of call.leave() result
      dispatch(clearActiveCall());
      // Use setTimeout to ensure state updates before navigation
      setTimeout(() => {
        navigate(-1); // Go back to previous page
      }, 100);
    }
  };

  const handleCallEnded = () => {
    // Prevent multiple navigations
    if (isLeavingRef.current) {
      return;
    }
    isLeavingRef.current = true;

    dispatch(clearActiveCall());
    // Use setTimeout to ensure state updates before navigation
    setTimeout(() => {
      navigate(-1);
    }, 100);
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
        <StreamCall call={call!} onCallEnded={handleCallEnded}>
          <SpeakerLayout />
          <CallControls onLeaveCall={leaveCall} />
        </StreamCall>
      </StreamTheme>
    </div>
  );
};
