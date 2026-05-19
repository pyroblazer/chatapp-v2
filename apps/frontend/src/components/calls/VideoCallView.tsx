import { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { PiPVideo } from './PiPVideo';
import { ControlBar } from './ControlBar';
import { User } from '../../utils/types';

interface VideoCallViewProps {
  localStream: MediaStream | undefined;
  remoteStream: MediaStream | undefined;
  caller: User | undefined;
  receiver: User | undefined;
  isMicMuted: boolean;
  isCameraOff: boolean;
  callError?: string | null;
  isCallInProgress: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onHangUp: () => void;
}

export const VideoCallView = ({
  localStream,
  remoteStream,
  caller,
  receiver,
  isMicMuted,
  isCameraOff,
  callError,
  isCallInProgress,
  onToggleMic,
  onToggleCamera,
  onHangUp,
}: VideoCallViewProps) => {
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const participantName = caller?.username || receiver?.username || 'Participant';

  return (
    <CallContainer>
      {callError && (
        <ErrorMessage>
          <ErrorIcon>⚠️</ErrorIcon>
          <ErrorText>{callError}</ErrorText>
          <RetryButton onClick={() => window.location.reload()}>
            Retry
          </RetryButton>
        </ErrorMessage>
      )}

      {!localStream && isCallInProgress && !callError && (
        <HardwareWarning>
          <WarningIcon>⚠️</WarningIcon>
          <WarningText>
            Unable to access camera/microphone. It may be in use by another application.
            Close other apps using the camera/mic and try again.
          </WarningText>
        </HardwareWarning>
      )}

      {remoteStream ? (
        <>
          <RemoteVideo
            ref={remoteVideoRef}
            playsInline
            autoPlay
          />
          <ParticipantOverlay>{participantName}</ParticipantOverlay>
        </>
      ) : (
        <LoadingState>Connecting...</LoadingState>
      )}

      {localStream && !isCameraOff && (
        <PiPVideo stream={localStream} isMuted={true} />
      )}

      <ControlBar
        isMicMuted={isMicMuted}
        isCameraOff={isCameraOff}
        showCameraButton={true}
        onToggleMic={onToggleMic}
        onToggleCamera={onToggleCamera}
        onHangUp={onHangUp}
      />
    </CallContainer>
  );
};

const CallContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #000;
  z-index: 1000;
  display: flex;
  flex-direction: column;
`;

const RemoteVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ParticipantOverlay = styled.div`
  position: absolute;
  top: 60px;
  left: 20px;
  color: white;
  font-size: 18px;
  font-weight: 500;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
`;

const LoadingState = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
`;

const ErrorMessage = styled.div`
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(239, 68, 68, 0.95);
  color: white;
  padding: 16px 24px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1001;
  max-width: 600px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;

const ErrorIcon = styled.span`
  font-size: 24px;
`;

const ErrorText = styled.span`
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
`;

const RetryButton = styled.button`
  background: white;
  color: #ef4444;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.05);
    background: #f0f0f0;
  }
`;

const HardwareWarning = styled.div`
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(251, 191, 36, 0.95);
  color: #000;
  padding: 16px 24px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1001;
  max-width: 600px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;

const WarningIcon = styled.span`
  font-size: 24px;
`;

const WarningText = styled.span`
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
`;
