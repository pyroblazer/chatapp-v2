import { FC, useContext } from 'react';
import { useSelector } from 'react-redux';
import { AuthContext } from '../../utils/context/AuthContext';
import { fullName } from '../../utils/helpers';
import { FriendListItemContainer } from '../../utils/styles/friends';
import { ContextMenuEvent, Friend } from '../../utils/types';
import { UserAvatar } from '../users/UserAvatar';
import { RootState } from '../../store';

type Props = {
  friend: Friend;
  online: boolean;
  onContextMenu: (e: ContextMenuEvent, friend: Friend) => void;
};

export const FriendListItem: FC<Props> = ({
  friend,
  online,
  onContextMenu,
}) => {
  const { user } = useContext(AuthContext);
  const userStatuses = useSelector((state: RootState) => state.friends.userStatuses);

  const friendUserInstance =
    user?.id === friend.sender.id ? friend.receiver : friend.sender;

  const status = userStatuses[friendUserInstance.id] ?? (online ? 'online' : 'offline');

  return (
    <FriendListItemContainer
      onContextMenu={(e) => onContextMenu(e, friend)}
      online={online}
    >
      <UserAvatar user={friendUserInstance} status={status} />
      <div className="friendDetails">
        <span className="username">{fullName(friendUserInstance)}</span>
        {online && (
          <span className="status">
            {friendUserInstance.presence?.statusMessage}
          </span>
        )}
      </div>
    </FriendListItemContainer>
  );
};
