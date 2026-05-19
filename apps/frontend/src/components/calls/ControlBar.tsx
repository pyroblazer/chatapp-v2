import styled from 'styled-components';
import { MdMic, MdMicOff, MdVideocam, MdVideocamOff, MdCallEnd } from 'react-icons/md';

interface ControlBarProps {
  isMicMuted: boolean;
  isCameraOff: boolean;
  showCameraButton: boolean;
  onToggleMic: () => void;
  onToggleCamera?: () => void;
  onHangUp: () => void;
}

export const ControlBar = ({
  isMicMuted,
  isCameraOff,
  showCameraButton,
  onToggleMic,
  onToggleCamera,
  onHangUp,
}: ControlBarProps) => {
  return (
    <StyledControlBar>
      <ControlButton
        onClick={onToggleMic}
        variant={isMicMuted ? 'muted' : 'default'}
        aria-label={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
      >
        {isMicMuted ? <MdMicOff size={24} /> : <MdMic size={24} />}
      </ControlButton>

      {showCameraButton && onToggleCamera && (
        <ControlButton
          onClick={onToggleCamera}
          variant={isCameraOff ? 'muted' : 'default'}
          aria-label={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
        >
          {isCameraOff ? <MdVideocamOff size={24} /> : <MdVideocam size={24} />}
        </ControlButton>
      )}

      <ControlButton
        onClick={onHangUp}
        variant="danger"
        aria-label="Hang up"
      >
        <MdCallEnd size={24} />
      </ControlButton>
    </StyledControlBar>
  );
};

const StyledControlBar = styled.div`
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

  @media (max-width: 768px) {
    bottom: 20px;
    padding: 12px 20px;
    gap: 15px;
  }
`;

const ControlButton = styled.button<{ variant: 'default' | 'danger' | 'muted' }>`
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

  ${props => {
    switch(props.variant) {
      case 'danger': return 'background: #ef4444; color: white;';
      case 'muted': return 'background: #ef4444; color: white;';
      default: return 'background: #374151; color: white;';
    }
  }}

  &:hover:not(:disabled) {
    transform: scale(1.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }
`;
