import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { RootState } from '../../store';
import { selectType } from '../../store/selectedSlice';
import { MessagePanelConversationHeader } from './headers/MessagePanelConversationHeader';
import { MessagePanelGroupHeader } from './headers/MessagePanelGroupHeader';

export const MessagePanelHeader = () => {
  const { id: routeId } = useParams();
  const type = useSelector(selectType);

  // The call UI is now handled globally by TwoWayCallUI in AppPage.tsx
  // So we always show the regular header
  return type === 'private' ? (
    <MessagePanelConversationHeader />
  ) : (
    <MessagePanelGroupHeader />
  );
};
