import { useContext } from 'react';
import { FaPhoneAlt, FaVideo } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { RootState } from '../../../store';
import { setActiveCall } from '../../../store/call/callSlice';
import { selectConversationById } from '../../../store/conversationSlice';
import { AuthContext } from '../../../utils/context/AuthContext';
import { SocketContext } from '../../../utils/context/SocketContext';
import { getRecipientFromConversation } from '../../../utils/helpers';
import { useStreamClient } from '../../../context/StreamContext';
import {
  MessagePanelHeaderIcons,
  MessagePanelHeaderStyle,
} from '../../../utils/styles';

export const MessagePanelConversationHeader = () => {
  const user = useContext(AuthContext).user!;
  const { id } = useParams();
  const socket = useContext(SocketContext);
  const client = useStreamClient();
  const navigate = useNavigate();

  const dispatch = useDispatch();
  const conversation = useSelector((state: RootState) =>
    selectConversationById(state, id!)
  );

  const recipient = getRecipientFromConversation(conversation, user);

  const startCall = async (type: 'video' | 'audio') => {
    if (!conversation || !recipient) return;

    try {
      // Create a unique call ID
      const callId = `call-${conversation.id}-${Date.now()}`;

      // Create and join the call via Stream (caller joins immediately)
      const call = client.call('default', callId);
      await call.join({ create: true });

      // Notify the recipient via Socket.IO
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

      // Navigate to the call page (opens like Google Meet)
      navigate(`/call/${callId}`, { replace: false });
    } catch (error) {
      console.error('Failed to start call:', error);
    }
  };

  const videoCallUser = async () => {
    await startCall('video');
  };

  const voiceCallUser = async () => {
    await startCall('audio');
  };

  return (
    <MessagePanelHeaderStyle>
      <div>
        <span>{recipient?.username || 'User'}</span>
      </div>
      <MessagePanelHeaderIcons>
        <FaPhoneAlt
          size={24}
          cursor="pointer"
          onClick={voiceCallUser}
          data-testid="voice-call-button"
        />
        <FaVideo
          size={30}
          cursor="pointer"
          onClick={videoCallUser}
          data-testid="video-call-button"
        />
      </MessagePanelHeaderIcons>
    </MessagePanelHeaderStyle>
  );
};
