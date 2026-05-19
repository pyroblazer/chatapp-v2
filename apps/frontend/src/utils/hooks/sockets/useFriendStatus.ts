import { useEffect } from 'react';
import { useContext } from 'react';
import { useDispatch } from 'react-redux';
import { SocketContext } from '../../context/SocketContext';
import { setUserStatus, UserStatus } from '../../../store/friends/friendsSlice';
import { AppDispatch } from '../../../store';

export const useFriendStatus = () => {
  const socket = useContext(SocketContext);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const handleStatusChange = (payload: { userId: string; status: UserStatus }) => {
      dispatch(setUserStatus(payload));
    };

    socket.on('onFriendStatusChange', handleStatusChange);
    return () => {
      socket.off('onFriendStatusChange', handleStatusChange);
    };
  }, [socket, dispatch]);
};
