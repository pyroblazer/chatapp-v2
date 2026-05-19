import { useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../../store';
import {
  setIsCallInProgress,
  setIsReceivingCall,
  setConnection,
  setCall,
  setActiveConversationId,
  setRemoteStream,
} from '../../../store/call/callSlice';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import { AcceptedCallPayload } from '../../types';
import { debugPeer, debugStream } from '../../debug/webrtc';

/**
 * This useEffect will only trigger logic for the person who initiated
 * the call. It will start a peer connection with the person who already
 * accepted the call.
 */
export function useVideoCallAccept() {
  const { user } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const dispatch = useDispatch<AppDispatch>();
  const { peer, localStream } = useSelector((state: RootState) => state.call);
  const navigate = useNavigate();

  useEffect(() => {
    socket.on('onVideoCallAccept', (data: AcceptedCallPayload) => {
      console.log('=== Video Call Accepted ===');
      console.log('Call data:', data);

      dispatch(setIsCallInProgress(true));
      dispatch(setIsReceivingCall(false));
      dispatch(setActiveConversationId(data.conversation.id));

      // Navigate to the conversation when call is accepted
      if (data.conversation.id) {
        navigate(`/conversations/${data.conversation.id}`);
      }

      if (!peer) {
        console.error('Peer not initialized');
        return;
      }

      if (data.caller.id === user!.id) {
        console.log('=== Video Call Accepted ===');
        console.log('Call data:', data);

        if (!peer || !peer.id) {
          console.error('Peer not ready or missing ID');
          return;
        }

        const acceptorPeerId = data.acceptor.peer?.id;
        if (!acceptorPeerId) {
          console.error('Acceptor peer ID missing from payload:', data.acceptor);
          return;
        }

        console.log('Initiating call to peer:', acceptorPeerId);
        console.log('Peer state:', debugPeer(peer));
        console.log('Local stream:', localStream);
        if (localStream) {
          debugStream(localStream, 'Local');
        }

        const connection = peer.connect(acceptorPeerId);
        dispatch(setConnection(connection));
        if (!connection) {
          console.error('Failed to create data connection');
          return;
        }

        console.log('Data connection created');

        if (localStream) {
          console.log('Calling with local stream');
          const newCall = peer.call(acceptorPeerId, localStream);
          dispatch(setCall(newCall));

          console.log('Call created:', newCall);

          // Attach stream listener IMMEDIATELY
          newCall.on('stream', (remoteStream) => {
            console.log('Received remote stream:', remoteStream);
            debugStream(remoteStream, 'Remote');
            dispatch(setRemoteStream(remoteStream));
          });

          newCall.on('error', (err) => {
            console.error('PeerJS call error:', err);
          });

          newCall.on('close', () => {
            console.log('PeerJS call closed');
          });
        }
      }
    });
    return () => {
      socket.off('onVideoCallAccept');
    };
  }, [localStream, peer, navigate, dispatch, user]);
}
