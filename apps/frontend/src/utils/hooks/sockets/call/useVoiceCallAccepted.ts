import { useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../../../store';
import {
  setActiveConversationId,
  setCall,
  setConnection,
  setIsCallInProgress,
  setIsReceivingCall,
  setRemoteStream,
} from '../../../../store/call/callSlice';
import { WebsocketEvents } from '../../../constants';
import { AuthContext } from '../../../context/AuthContext';
import { SocketContext } from '../../../context/SocketContext';
import { AcceptedCallPayload } from '../../../types';
import { debugPeer, debugStream } from '../../../../utils/debug/webrtc';

export function useVoiceCallAccepted() {
  const { user } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const dispatch = useDispatch<AppDispatch>();
  const { peer, localStream } = useSelector((state: RootState) => state.call);
  const navigate = useNavigate();

  useEffect(() => {
    socket.on(
      WebsocketEvents.VOICE_CALL_ACCEPTED,
      (data: AcceptedCallPayload) => {
        console.log('=== Voice Call Accepted ===');
        console.log('Call data:', data);

        if (!peer) {
          console.error('Peer not initialized');
          return;
        }

        dispatch(setActiveConversationId(data.conversation.id));
        dispatch(setIsCallInProgress(true));
        dispatch(setIsReceivingCall(false));

        // Navigate to the conversation when call is accepted
        if (data.conversation.id) {
          navigate(`/conversations/${data.conversation.id}`);
        }

        if (data.caller.id === user!.id) {
          if (!peer || !peer.id) {
            console.error('Peer not ready or missing ID');
            return;
          }

          const acceptorPeerId = data.acceptor.peer?.id;
          if (!acceptorPeerId) {
            console.error('Acceptor peer ID missing from payload:', data.acceptor);
            return;
          }

          console.log('Initiating voice call to peer:', acceptorPeerId);
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
      }
    );

    return () => {
      socket.off(WebsocketEvents.VOICE_CALL_ACCEPTED);
    };
  }, [localStream, peer, navigate, dispatch, user]);
}
