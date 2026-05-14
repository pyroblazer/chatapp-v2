import { useContext, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { MdCallEnd, MdMic, MdMicOff, MdVideocam, MdVideocamOff } from 'react-icons/md';
import { AppDispatch, RootState } from '../../store';
import { resetState } from '../../store/call/callSlice';
import { AuthContext } from '../../utils/context/AuthContext';
import { SocketContext } from '../../utils/context/SocketContext';
import { WebsocketEvents } from '../../utils/constants';
import { UserAvatar } from '../../components/users/UserAvatar';

const CallPageContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #111;
  position: relative;
  height: 100%;
`;

const VideoGrid = styled.div`
  position: relative;
  width: 100%;
  height: calc(100% - 80px);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const RemoteVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const LocalVideo = styled.video`
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 180px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #5865f2;
`;

const VoiceCallView = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #fff;
  font-size: 18px;
`;

const Controls = styled.div`
  display: flex;
  gap: 20px;
  padding: 16px;
  background: #1e1e1e;
  width: 100%;
  justify-content: center;
`;

const ControlButton = styled.button<{ danger?: boolean }>`
  background: ${({ danger }) => (danger ? '#f04747' : '#2f3136')};
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  &:hover {
    opacity: 0.85;
  }
`;

export const CurrentCallPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const { localStream, remoteStream, caller, receiver, callType, call, connection } =
    useSelector((state: RootState) => state.call);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream)
      localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream)
      remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  const hangUp = () => {
    const hangUpEvent =
      callType === 'video'
        ? WebsocketEvents.VIDEO_CALL_HANG_UP
        : WebsocketEvents.VOICE_CALL_HANG_UP;
    socket.emit(hangUpEvent, {});
    localStream?.getTracks().forEach((t) => t.stop());
    remoteStream?.getTracks().forEach((t) => t.stop());
    call?.close();
    connection?.close();
    dispatch(resetState());
  };

  const otherUser = caller?.id === user?.id ? receiver : caller;

  return (
    <CallPageContainer>
      {callType === 'video' ? (
        <VideoGrid>
          <RemoteVideo ref={remoteVideoRef} autoPlay playsInline />
          <LocalVideo ref={localVideoRef} autoPlay playsInline muted />
        </VideoGrid>
      ) : (
        <VoiceCallView>
          {otherUser && <UserAvatar user={otherUser} />}
          <span>{otherUser?.username ?? 'Unknown'}</span>
          <span style={{ color: '#aaa', fontSize: 14 }}>Voice call in progress…</span>
        </VoiceCallView>
      )}
      <Controls>
        <ControlButton onClick={hangUp} danger>
          <MdCallEnd size={24} />
        </ControlButton>
      </Controls>
    </CallPageContainer>
  );
};
