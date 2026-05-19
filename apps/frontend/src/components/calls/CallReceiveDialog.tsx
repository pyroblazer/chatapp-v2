import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { CallReceiveDialogContainer } from '../../utils/styles';
import { UserAvatar } from '../users/UserAvatar';
import { MdCall, MdCallEnd } from 'react-icons/md';
import { HandleCallType } from '../../utils/types';
import { useContext } from 'react';
import { SocketContext } from '../../utils/context/SocketContext';
import { SenderEvents, WebsocketEvents } from '../../utils/constants';
import { useDispatch } from 'react-redux';
import { setCallError } from '../../store/call/callSlice';

export const CallReceiveDialog = () => {
  const { caller, callType } = useSelector((state: RootState) => state.call);
  const socket = useContext(SocketContext);
  const dispatch = useDispatch();
  const [isAccepting, setIsAccepting] = useState(false);

  const handleCall = (type: HandleCallType) => {
    const payload = { caller };
    switch (type) {
      case 'accept':
        setIsAccepting(true);
        const emitEvent = callType === 'video'
          ? 'videoCallAccepted'
          : SenderEvents.VOICE_CALL_ACCEPT;
        socket.emit(emitEvent, payload);

        // Add timeout to reset if no response
        setTimeout(() => {
          setIsAccepting(false);
          dispatch(setCallError('No response from server. Please try again.'));
        }, 5000);
        break;
      case 'reject':
        return callType === 'video'
          ? socket.emit(WebsocketEvents.VIDEO_CALL_REJECTED, payload)
          : socket.emit(WebsocketEvents.VOICE_CALL_REJECTED, payload);
    }
  };
  return (
    <CallReceiveDialogContainer data-testid="call-receive-dialog">
      <UserAvatar user={caller!} />
      <div className="content">
        <span data-testid="call-message">
          {caller!.username} wants to {callType === 'audio' ? 'voice' : 'video'}{' '}
          call you
        </span>
      </div>
      <div className="icons">
        <div
          className="accept"
          data-testid="accept-call-button"
          onClick={() => handleCall('accept')}
          style={{ opacity: isAccepting ? 0.6 : 1, cursor: isAccepting ? 'not-allowed' : 'pointer' }}
        >
          {isAccepting ? 'Connecting...' : <MdCall />}
        </div>
        <div
          className="reject"
          data-testid="reject-call-button"
          onClick={() => handleCall('reject')}
        >
          <MdCallEnd />
        </div>
      </div>
    </CallReceiveDialogContainer>
  );
};
