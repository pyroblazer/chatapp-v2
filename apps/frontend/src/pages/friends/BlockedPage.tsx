import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import {
  fetchBlockedUsersThunk,
  unblockUserThunk,
} from '../../store/blockedUsersSlice';
import { UserAvatar } from '../../components/users/UserAvatar';
import {
  FriendListContainer,
  FriendRequestItemContainer,
} from '../../utils/styles/friends';
import styled from 'styled-components';

const BlockedUserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
`;

const UnblockButton = styled.button`
  background: transparent;
  border: 1px solid #f04747;
  color: #f04747;
  border-radius: 4px;
  padding: 6px 14px;
  cursor: pointer;
  font-size: 14px;
  &:hover {
    background: #f04747;
    color: #fff;
  }
`;

export const BlockedPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { blockedUsers } = useSelector(
    (state: RootState) => state.blockedUsers,
  );

  useEffect(() => {
    dispatch(fetchBlockedUsersThunk());
  }, []);

  return (
    <FriendListContainer>
      {blockedUsers.length === 0 && <div>No blocked users</div>}
      {blockedUsers.map((blockedUser) => (
        <FriendRequestItemContainer
          key={blockedUser.id}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <BlockedUserInfo>
            <UserAvatar user={blockedUser} />
            <span>{blockedUser.username}</span>
          </BlockedUserInfo>
          <UnblockButton
            onClick={() => dispatch(unblockUserThunk(blockedUser.username))}
          >
            Unblock
          </UnblockButton>
        </FriendRequestItemContainer>
      ))}
    </FriendListContainer>
  );
};
