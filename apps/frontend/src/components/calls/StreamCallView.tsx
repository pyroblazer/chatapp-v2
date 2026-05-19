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

interface StreamCallViewProps {
  callId: string;
  type?: 'video' | 'audio';
}

export const StreamCallView: React.FC<StreamCallViewProps> = ({ callId, type = 'video' }) => {
  const client = useStreamClient();
  const dispatch = useDispatch<AppDispatch>();
  const [call, setCall] = useState(client.call('default', callId));
  const [hasJoined, setHasJoined] = useState(false);
  const [callTimeout, setCallTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let mounted = true;

    const joinCall = async () => {
      try {
        // Join the call
        await call.join({ create: false });
        if (mounted) {
          setHasJoined(true);
        }
      } catch (error) {
        console.error('Failed to join call:', error);
        // Call might not exist yet, try creating it
        try {
          await call.create({ data: { type } });
          await call.join();
          if (mounted) {
            setHasJoined(true);
          }
        } catch (createError) {
          console.error('Failed to create/join call:', createError);
        }
      }
    };

    // Set up a timeout for miscall (30 seconds to answer)
    const timeoutId = setTimeout(() => {
      const currentState = call.state.callingState;
      if (currentState !== CallingState.JOINED && currentState !== CallingState.JOINING) {
        console.log('Call not answered within timeout, ending call');
        leaveCall();
      }
    }, 30000); // 30 seconds

    setCallTimeout(timeoutId);
    joinCall();

    return () => {
      mounted = false;
      if (callTimeout) {
        clearTimeout(callTimeout);
      }
    };
  }, [call, type]);

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
        <div>Joining call...</div>
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
