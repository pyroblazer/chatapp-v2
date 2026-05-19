import { useContext } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../../utils/context/AuthContext';
import { getRecipientFromConversation, formatBadgeCount } from '../../utils/helpers';
import {
  ConversationSidebarItemDetails,
  ConversationSidebarItemStyle,
  IconBadge,
} from '../../utils/styles';
import { Conversation } from '../../utils/types';
import { RootState } from '../../store';
import { UserAvatar } from '../users/UserAvatar';


type Props = {
  conversation: Conversation;
};

export const ConversationSidebarItem: React.FC<Props> = ({ conversation }) => {
  const MESSAGE_LENGTH_MAX = 50;
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const recipient = getRecipientFromConversation(conversation, user);
  const unreadCount = useSelector(
    (state: RootState) => state.unread.conversationCounts[conversation.id] ?? 0
  );
  const userStatuses = useSelector((state: RootState) => state.friends.userStatuses);
  const badgeText = formatBadgeCount(unreadCount);
  const recipientStatus = recipient ? userStatuses[recipient.id] : undefined;
  const lastMessageContent = () => {
    const { lastMessageSent } = conversation;
    if (lastMessageSent && lastMessageSent.content)
      return lastMessageSent.content?.length >= MESSAGE_LENGTH_MAX
        ? lastMessageSent.content?.slice(0, MESSAGE_LENGTH_MAX).concat('...')
        : lastMessageSent.content;
    return null;
  };

  return (
    <>
      <ConversationSidebarItemStyle
        onClick={() => navigate(`/conversations/${conversation.id}`)}
        selected={id! === conversation.id}
      >
        {recipient && (
          <UserAvatar user={recipient} status={recipientStatus} />
        )}
        <ConversationSidebarItemDetails>
          <span className="conversationName">
            {`${recipient?.firstName} ${recipient?.lastName}`}
          </span>
          <span className="conversationLastMessage">
            {lastMessageContent()}
          </span>
        </ConversationSidebarItemDetails>
        {badgeText && <IconBadge>{badgeText}</IconBadge>}
      </ConversationSidebarItemStyle>
    </>
  );
};
