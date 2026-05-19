import { FC } from 'react';
import { CDN_URL } from '../../utils/constants';
import { UserAvatarContainer } from '../../utils/styles';
import { User } from '../../utils/types';
import defaultAvatar from '../../__assets__/default_avatar.jpg';

type UserStatus = 'online' | 'offline' | 'in-call';

const STATUS_COLORS: Record<UserStatus, string> = {
  online: '#2ecc71',
  offline: '#888',
  'in-call': '#e74c3c',
};

type Props = {
  user: User;
  status?: UserStatus;
  onClick?: (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => void;
};

export const UserAvatar: FC<Props> = ({ user, status, onClick }) => {
  const getProfilePicture = () => {
    const { profile } = user;
    return profile && profile.avatar
      ? CDN_URL.BASE.concat(profile.avatar)
      : defaultAvatar;
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <UserAvatarContainer
        src={getProfilePicture()}
        alt="avatar"
        onClick={onClick}
      />
      {status && (
        <span
          style={{
            position: 'absolute',
            bottom: 2,
            right: 2,
            width: 11,
            height: 11,
            borderRadius: '50%',
            background: STATUS_COLORS[status],
            border: '2px solid #1a1a2e',
            display: 'block',
          }}
          title={status === 'in-call' ? 'In a call' : status === 'online' ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};
