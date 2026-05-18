import { useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../store';
import { resetState } from '../../../../store/call/callSlice';
import { WebsocketEvents } from '../../../constants';
import { SocketContext } from '../../../context/SocketContext';

export function useVoiceCallRejected() {
  const socket = useContext(SocketContext);
  const dispatch = useDispatch<AppDispatch>();
  const { localStream, remoteStream, call, connection } = useSelector(
    (state: RootState) => state.call
  );

  useEffect(() => {
    socket.on(WebsocketEvents.VOICE_CALL_REJECTED, () => {
      localStream?.getTracks().forEach((track) => track.stop());
      remoteStream?.getTracks().forEach((track) => track.stop());
      call?.close();
      connection?.close();
      dispatch(resetState());
    });

    return () => {
      socket.off(WebsocketEvents.VOICE_CALL_REJECTED);
    };
  }, [localStream, remoteStream, call, connection, dispatch]);
}
