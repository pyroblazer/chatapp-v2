import { useState, useContext } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { SocketContext } from '../../utils/context/SocketContext';
import { VideoCallView } from './VideoCallView';
import { VoiceCallView } from './VoiceCallView';
import { CallingStateView } from './CallingStateView';

export const TwoWayCallUI = () => {
  const socket = useContext(SocketContext);
  const { localStream, remoteStream, caller, receiver, callType, isCalling, callError, isCallInProgress } = useSelector(
    (state: RootState) => state.call
  );

  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const toggleMic = () => {
    if (!localStream) return;
    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length > 0) {
      audioTracks[0].enabled = !audioTracks[0].enabled;
      setIsMicMuted(!audioTracks[0].enabled);
    }
  };

  const toggleCamera = () => {
    if (!localStream) return;
    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length > 0) {
      videoTracks[0].enabled = !videoTracks[0].enabled;
      setIsCameraOff(!videoTracks[0].enabled);
    }
  };

  const hangUp = () => {
    const event = callType === 'audio' ? 'onVoiceCallHangUp' : 'videoCallHangUp';
    socket.emit(event, { caller, receiver });
  };

  // If caller is still waiting for acceptance, show calling state
  if (isCalling && !remoteStream) {
    return <CallingStateView caller={caller} receiver={receiver} callType={callType} onHangUp={hangUp} />;
  }

  if (callType === 'video') {
    return (
      <VideoCallView
        localStream={localStream}
        remoteStream={remoteStream}
        caller={caller}
        receiver={receiver}
        isMicMuted={isMicMuted}
        isCameraOff={isCameraOff}
        callError={callError}
        isCallInProgress={isCallInProgress}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onHangUp={hangUp}
      />
    );
  }

  return (
    <VoiceCallView
      localStream={localStream}
      remoteStream={remoteStream}
      caller={caller}
      receiver={receiver}
      isMicMuted={isMicMuted}
      onToggleMic={toggleMic}
      onHangUp={hangUp}
    />
  );
};
