import { useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useNavigate } from 'react-router-dom';
import { UserSidebar } from '../components/sidebars/UserSidebar';
import { AppDispatch, RootState } from '../store';
import { removeFriendRequest } from '../store/friends/friendsSlice';
import { SocketContext } from '../utils/context/SocketContext';
import { useToast } from '../utils/hooks/useToast';
import { LayoutPage } from '../utils/styles';
import {
  AcceptFriendRequestResponse,
  FriendRequest,
  SelectableTheme,
} from '../utils/types';
import { BsFillPersonCheckFill } from 'react-icons/bs';
import { fetchFriendRequestThunk } from '../store/friends/friendsThunk';
import { ThemeProvider } from 'styled-components';
import { DarkTheme, LightTheme } from '../utils/themes';
import { AuthContext } from '../utils/context/AuthContext';
import { useFriendRequestReceived } from '../utils/hooks/sockets/friend-requests/useFriendRequestReceived';
import { useStreamCallReceived } from '../utils/hooks/sockets/useStreamCallReceived';
import { StreamProvider } from '../context/StreamContext';

export const AppPage = () => {
  const { user } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { info } = useToast({ theme: 'dark' });
  const { theme } = useSelector((state: RootState) => state.settings);
  const storageTheme = localStorage.getItem('theme') as SelectableTheme;

  useEffect(() => {
    dispatch(fetchFriendRequestThunk());
  }, [dispatch]);

  useFriendRequestReceived();
  const { IncomingCallUI } = useStreamCallReceived();

  useEffect(() => {
    socket.on('onFriendRequestCancelled', (payload: FriendRequest) => {
      dispatch(removeFriendRequest(payload));
    });
    socket.on(
      'onFriendRequestAccepted',
      (payload: AcceptFriendRequestResponse) => {
        dispatch(removeFriendRequest(payload.friendRequest));
        socket.emit('getOnlineFriends');
        info(
          `${payload.friendRequest.receiver.firstName} accepted your friend request`,
          {
            position: 'bottom-left',
            icon: BsFillPersonCheckFill,
            onClick: () => navigate('/friends'),
          }
        );
      }
    );

    socket.on('onFriendRequestRejected', (payload: FriendRequest) => {
      dispatch(removeFriendRequest(payload));
    });
    return () => {
      socket.off('onFriendRequestCancelled');
      socket.off('onFriendRequestRejected');
      socket.off('onFriendRequestReceived');
      socket.off('onFriendRequestAccepted');
    };
  }, [socket, dispatch, navigate, info]);

  return (
    <StreamProvider>
      <ThemeProvider
        theme={
          storageTheme
            ? storageTheme === 'dark'
              ? DarkTheme
              : LightTheme
            : theme === 'dark'
            ? DarkTheme
            : LightTheme
        }
      >
        {IncomingCallUI}
        <LayoutPage>
          <UserSidebar />
          <Outlet />
        </LayoutPage>
      </ThemeProvider>
    </StreamProvider>
  );
};
