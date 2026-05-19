import { useContext } from 'react';
import { FaPhoneAlt, FaVideo } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { RootState } from '../../../store';
import { setActiveCall } from '../../../store/call/callSlice';
import { selectConversationById } from '../../../store/conversationSlice';
import { AuthContext } from '../../../utils/context/AuthContext';
import { SocketContext } from '../../../utils/context/SocketContext';
import { getRecipientFromConversation } from '../../../utils/helpers';
import { useStreamCallWaiting } from '../../../utils/hooks/sockets/useStreamCallWaiting';
import {
  MessagePanelHeaderIcons,
  MessagePanelHeaderStyle,
} from '../../../utils/styles';

export const MessagePanelConversationHeader = () => {
  const user = useContext(AuthContext).user!;
  const { id } = useParams();
  const socket = useContext(SocketContext);
  const { WaitingCallUI, BusyUI, startWaiting } = useStreamCallWaiting();

  const dispatch = useDispatch();
  const conversation = useSelector((state: RootState) =>
    selectConversationById(state, id!)
  );
  const userStatuses = useSelector((state: RootState) => state.friends.userStatuses);

  const recipient = getRecipientFromConversation(conversation, user);
  const recipientStatus = recipient ? userStatuses[recipient.id] : undefined;
  const recipientInCall = recipientStatus === 'in-call';

  const startCall = async (type: 'video' | 'audio') => {
    if (!conversation || !recipient || recipientInCall) return;

    const callId = `call-${conversation.id}-${Date.now()}`;

    const callerDisplayName = user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.username;

    socket.emit('streamCallInitiated', {
      callId,
      callType: type,
      callerId: user.id,
      callerName: callerDisplayName,
      recipientId: recipient.id,
      conversationId: conversation.id,
    });

    const recipientDisplayName = recipient.firstName && recipient.lastName
      ? `${recipient.firstName} ${recipient.lastName}`
      : recipient.username;

    startWaiting({
      callId,
      recipientId: recipient.id,
      recipientName: recipientDisplayName,
      callType: type,
      initiatedAt: Date.now(),
    });
  };

  return (
    <>
      <MessagePanelHeaderStyle>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{recipient?.username || 'User'}</span>
          {recipientInCall && (
            <span style={{ fontSize: '12px', color: '#e74c3c', fontWeight: 500 }}>
              • In a call
            </span>
          )}
        </div>
        <MessagePanelHeaderIcons>
          <FaPhoneAlt
            size={24}
            cursor={recipientInCall ? 'not-allowed' : 'pointer'}
            onClick={() => startCall('audio')}
            style={{ opacity: recipientInCall ? 0.4 : 1 }}
            data-testid="voice-call-button"
            title={recipientInCall ? 'User is currently in a call' : undefined}
          />
          <FaVideo
            size={30}
            cursor={recipientInCall ? 'not-allowed' : 'pointer'}
            onClick={() => startCall('video')}
            style={{ opacity: recipientInCall ? 0.4 : 1 }}
            data-testid="video-call-button"
            title={recipientInCall ? 'User is currently in a call' : undefined}
          />
        </MessagePanelHeaderIcons>
      </MessagePanelHeaderStyle>
      {WaitingCallUI}
      {BusyUI}
    </>
  );
};
