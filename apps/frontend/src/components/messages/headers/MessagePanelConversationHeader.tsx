import { useContext } from 'react';
import { FaPhoneAlt, FaVideo } from 'react-icons/fa';
import { useParams } from 'react-router-dom';
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

  const conversation = useSelector((state: any) =>
    selectConversationById(state, id!)
  );

  const recipient = getRecipientFromConversation(conversation, user);

  const startCall = async (type: 'video' | 'audio') => {
    if (!conversation || !recipient) return;

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
        </div>
        <MessagePanelHeaderIcons>
          <FaPhoneAlt
            size={24}
            cursor="pointer"
            onClick={() => startCall('audio')}
            data-testid="voice-call-button"
          />
          <FaVideo
            size={30}
            cursor="pointer"
            onClick={() => startCall('video')}
            data-testid="video-call-button"
          />
        </MessagePanelHeaderIcons>
      </MessagePanelHeaderStyle>
      {WaitingCallUI}
      {BusyUI}
    </>
  );
};
