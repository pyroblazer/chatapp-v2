import styled from 'styled-components';
import { UserAvatar } from '../users/UserAvatar';
import { User } from '../../utils/types';
import { MdCallEnd } from 'react-icons/md';

interface CallingStateViewProps {
  caller: User | undefined;
  receiver: User | undefined;
  callType: 'video' | 'audio' | undefined;
  onHangUp: () => void;
}

export const CallingStateView = ({
  caller,
  receiver,
  callType,
  onHangUp,
}: CallingStateViewProps) => {
  const recipient = receiver || caller;
  const recipientName = recipient?.username || 'Calling...';

  return (
    <CallContainer>
      <CallingContent>
        {recipient && <UserAvatar user={recipient} size={120} />}
        <ParticipantName>{recipientName}</ParticipantName>
        <CallStatus>
          {callType === 'video' ? 'Video calling...' : 'Voice calling...'}
        </CallStatus>
        <PulseAnimation />
      </CallingContent>

      <ControlBar>
        <HangupButton onClick={onHangUp} aria-label="Hang up">
          <MdCallEnd size={32} />
        </HangupButton>
      </ControlBar>
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

const CallingContent = styled.div`
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

const PulseAnimation = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  animation: pulse 1.5s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.2);
      opacity: 0.7;
    }
  }
`;

const ControlBar = styled.div`
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 20px;
  padding: 15px 25px;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(10px);
  border-radius: 30px;
`;

const HangupButton = styled.button`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s;
  background: #ef4444;
  color: white;

  &:hover:not(:disabled) {
    transform: scale(1.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
