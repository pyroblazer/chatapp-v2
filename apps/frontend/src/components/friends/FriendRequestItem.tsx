import { FC, useContext } from 'react';
import { AuthContext } from '../../utils/context/AuthContext';
import { FriendRequestItemContainer } from '../../utils/styles/friends';
import { FriendRequest, HandleFriendRequestAction } from '../../utils/types';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import {
  acceptFriendRequestThunk,
  cancelFriendRequestThunk,
  rejectFriendRequestThunk,
} from '../../store/friends/friendsThunk';
import { getFriendRequestDetails } from '../../utils/helpers';
import { toast } from 'react-toastify';
import { FriendRequestDetails } from './friend-request/FriendRequestDetails';
import { FriendRequestIcons } from './friend-request/FriendRequestIcons';

type Props = {
  friendRequest: FriendRequest;
};
export const FriendRequestItem: FC<Props> = ({ friendRequest }) => {
  const { user } = useContext(AuthContext);
  const dispatch = useDispatch<AppDispatch>();
  const friendRequestDetails = getFriendRequestDetails(friendRequest, user);

  const handleFriendRequest = (type?: HandleFriendRequestAction) => {
    const { id } = friendRequest;
    switch (type) {
      case 'accept':
        return dispatch(acceptFriendRequestThunk(id))
          .unwrap()
          .catch((err) => toast.error(err?.response?.data?.message || err?.message || 'Failed to accept request'));
      case 'reject':
        return dispatch(rejectFriendRequestThunk(id))
          .unwrap()
          .catch((err) => toast.error(err?.response?.data?.message || err?.message || 'Failed to reject request'));
      default:
        return dispatch(cancelFriendRequestThunk(id))
          .unwrap()
          .catch((err) => toast.error(err?.response?.data?.message || err?.message || 'Failed to cancel request'));
    }
  };

  return (
    <FriendRequestItemContainer>
      <FriendRequestDetails details={friendRequestDetails} />
      <FriendRequestIcons
        details={friendRequestDetails}
        handleFriendRequest={handleFriendRequest}
      />
    </FriendRequestItemContainer>
  );
};
