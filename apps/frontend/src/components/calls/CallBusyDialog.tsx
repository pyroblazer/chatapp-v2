import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { setUserBusy } from '../../store/call/callSlice';
import { SocketContext } from '../../utils/context/SocketContext';
import { useContext } from 'react';
import { CallReceiveDialogContainer } from '../../utils/styles';

export const CallBusyDialog = () => {
  const { isUserBusy, busyMessage } = useSelector((state: RootState) => state.call);
  const socket = useContext(SocketContext);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (!socket) return;

    socket.on('onUserBusy', (data: { userId: string; message: string }) => {
      dispatch(setUserBusy({ busy: true, message: data.message }));
      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        dispatch(setUserBusy({ busy: false }));
      }, 3000);
    });

    return () => {
      socket.off('onUserBusy');
    };
  }, [socket, dispatch]);

  if (!isUserBusy) return null;

  return (
    <CallReceiveDialogContainer data-testid="busy-dialog">
      <div className="content">
        <span>{busyMessage || 'User is currently in another call'}</span>
      </div>
    </CallReceiveDialogContainer>
  );
};