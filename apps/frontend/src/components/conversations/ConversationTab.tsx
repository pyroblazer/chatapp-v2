import {
  ConversationTabItemStyle,
  ConversationTabStyle,
  IconBadge,
} from '../../utils/styles';
import { chatTypes } from '../../utils/constants';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../../store';
import { updateType } from '../../store/selectedSlice';
import {
  selectTotalUnreadConversations,
  selectTotalUnreadGroups,
} from '../../store/unreadSlice';
import { formatBadgeCount } from '../../utils/helpers';
import { ConversationTypeData } from '../../utils/types';

export const ConversationTab = () => {
  const selectedType = useSelector(
    (state: RootState) => state.selectedConversationType.type
  );
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const totalPrivate = useSelector(selectTotalUnreadConversations);
  const totalGroup = useSelector(selectTotalUnreadGroups);
  const onSelectType = (chat: ConversationTypeData) => {
    dispatch(updateType(chat.type));
    if (chat.type === 'group') navigate('/groups');
    else navigate('/conversations');
  };
  return (
    <ConversationTabStyle>
      {chatTypes.map((chat) => {
        const count = chat.type === 'private' ? totalPrivate : totalGroup;
        const badgeText = formatBadgeCount(count);
        return (
          <ConversationTabItemStyle
            selected={chat.type === selectedType}
            key={chat.type}
            onClick={() => onSelectType(chat)}
          >
            {chat.label}
            {badgeText && <IconBadge>{badgeText}</IconBadge>}
          </ConversationTabItemStyle>
        );
      })}
    </ConversationTabStyle>
  );
};
