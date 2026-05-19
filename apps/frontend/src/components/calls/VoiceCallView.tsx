import styled from 'styled-components';
import { ControlBar } from './ControlBar';
import { UserAvatar } from '../users/UserAvatar';
import { User } from '../../utils/types';

interface VoiceCallViewProps {
  localStream: MediaStream | undefined;
  remoteStream: MediaStream | undefined;
  caller: User | undefined;
  receiver: User | undefined;
  isMicMuted: boolean;
  onToggleMic: () => void;
  onHangUp: () => void;
}

export const VoiceCallView = ({
  caller,
  receiver,
  isMicMuted,
  onToggleMic,
  onHangUp,
}: VoiceCallViewProps) => {
  const participant = caller || receiver;
  const participantName = participant?.username || 'Participant';

  return (
    <CallContainer>
      <VoiceCallContent>
        {participant && <UserAvatar user={participant} size={120} />}
        <ParticipantName>{participantName}</ParticipantName>
        <CallStatus>Voice call in progress</CallStatus>
        <AudioIndicator>
          <AudioWave />
        </AudioIndicator>
      </VoiceCallContent>

      <ControlBar
        isMicMuted={isMicMuted}
        isCameraOff={false}
        showCameraButton={false}
        onToggleMic={onToggleMic}
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

const VoiceCallContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
`;

const ParticipantName = styled.h2`
  color: white;
  font-size: 28px;
  margin: 20px 0 10px 0;
`;

const CallStatus = styled.p`
  color: rgba(255,255,255,0.7);
  font-size: 16px;
  margin-bottom: 30px;
`;

const AudioIndicator = styled.div`
  width: 200px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
`;

const AudioWave = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;

  &::before,
  &::after {
    content: '';
    width: 8px;
    height: 30px;
    background: rgba(255,255,255,0.5);
    border-radius: 4px;
    animation: wave 1s ease-in-out infinite;
  }

  &::after {
    animation-delay: 0.2s;
  }

  @keyframes wave {
    0%, 100% { transform: scaleY(0.5); }
    50% { transform: scaleY(1); }
  }
`;
