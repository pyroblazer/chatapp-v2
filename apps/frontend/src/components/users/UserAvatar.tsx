import { FC, memo } from 'react';
import { CDN_URL } from '../../utils/constants';
import { UserAvatarContainer } from '../../utils/styles';
import { User } from '../../utils/types';
import defaultAvatar from '../../__assets__/default_avatar.jpg';

type UserStatus = 'online' | 'offline' | 'in-call';

const STATUS_COLORS: Record<UserStatus, string> = {
  online: '#22c55e',
  offline: '#6b7280',
  'in-call': '#ef4444',
};

const STATUS_LABELS: Record<UserStatus, string> = {
  online: 'Online',
  offline: 'Offline',
  'in-call': 'In a call',
};

type Props = {
  user: User;
  status?: UserStatus;
  onClick?: (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => void;
};

export const UserAvatar: FC<Props> = memo(({ user, status, onClick }) => {
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
            bottom: 1,
            right: 1,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: STATUS_COLORS[status],
            // Use white border for contrast in both light and dark modes
            border: '2px solid rgba(255, 255, 255, 0.9)',
            boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)',
            display: 'block',
          }}
          title={STATUS_LABELS[status]}
        />
      )}
    </div>
  );
});
