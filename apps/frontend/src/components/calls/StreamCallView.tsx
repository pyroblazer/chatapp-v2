import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  StreamCall,
  StreamTheme,
  SpeakerLayout,
  CallControls,
  CallingState,
} from '@stream-io/video-react-sdk';
import { useStreamClient } from '../../context/StreamContext';
import { clearActiveCall } from '../../store/call/callSlice';
import { AppDispatch } from '../../store';
import { SocketContext } from '../../utils/context/SocketContext';
import { useContext } from 'react';

interface StreamCallViewProps {
  callId: string;
  type?: 'video' | 'audio';
}

export const StreamCallView: React.FC<StreamCallViewProps> = ({ callId, type = 'video' }) => {
  const client = useStreamClient();
  const dispatch = useDispatch<AppDispatch>();
  const socket = useContext(SocketContext);
  const [call, setCall] = useState(client.call('default', callId));
  const [hasJoined, setHasJoined] = useState(false);
  const [isCaller, setIsCaller] = useState(false);

  useEffect(() => {
    let mounted = true;

    const joinCall = async () => {
      try {
        // Try to join the call (for receiver)
        await call.join({ create: false });
        if (mounted) {
          setHasJoined(true);
          setIsCaller(false);
        }
      } catch (error) {
        console.error('Failed to join call:', error);
        // Call might not exist yet, we're the caller
        try {
          // Caller already joined when initiating, so just set state
          if (mounted) {
            setHasJoined(true);
            setIsCaller(true);
          }
        } catch (createError) {
          console.error('Failed to handle call:', createError);
        }
      }
    };

    joinCall();

    // Listen for call rejection
    const handleCallRejected = (data: { callId: string; recipientId: string }) => {
      if (data.callId === callId) {
        console.log('Call was rejected by recipient');
        leaveCall();
      }
    };

    socket.on('streamCallRejected', handleCallRejected);

    return () => {
      mounted = false;
      socket.off('streamCallRejected', handleCallRejected);
    };
  }, [call, callId, socket]);

  const leaveCall = async () => {
    try {
      await call.leave();
      dispatch(clearActiveCall());
    } catch (error) {
      console.error('Error leaving call:', error);
      dispatch(clearActiveCall());
    }
  };

  const handleCallEnded = () => {
    dispatch(clearActiveCall());
  };

  if (!hasJoined) {
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
          zIndex: 9999,
          color: 'white',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div>{isCaller ? 'Waiting for answer...' : 'Joining call...'}</div>
        <button
          onClick={leaveCall}
          style={{
            padding: '10px 20px',
            background: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <StreamTheme>
      <StreamCall call={call} onCallEnded={handleCallEnded}>
        <SpeakerLayout />
        <CallControls onLeaveCall={leaveCall} />
      </StreamCall>
    </StreamTheme>
  );
};
