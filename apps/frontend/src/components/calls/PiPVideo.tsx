import { useEffect, useRef } from 'react';
import styled from 'styled-components';

interface PiPVideoProps {
  stream: MediaStream;
  isMuted: boolean;
}

export const PiPVideo = ({ stream, isMuted }: PiPVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <PiPContainer>
      <StyledVideo
        ref={videoRef}
        playsInline
        autoPlay
        muted={isMuted}
      />
    </PiPContainer>
  );
};

const PiPContainer = styled.div`
  position: absolute;
  bottom: 100px;
  right: 20px;
  width: 150px;
  height: 150px;
  border-radius: 12px;
  overflow: hidden;
  background: #1a1a1a;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  border: 2px solid rgba(255,255,255,0.1);

  @media (max-width: 768px) {
    width: 100px;
    height: 100px;
    bottom: 80px;
    right: 15px;
  }
`;

const StyledVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
`;
