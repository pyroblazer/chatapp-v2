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
  setLocalStream,
} from '../../../store/call/callSlice';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import { AcceptedCallPayload } from '../../types';
import { debugPeer, debugStream } from '../../debug/webrtc';
import store from '../../../store';

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
        console.log('=== Caller (User A) - Initiating Call ===');
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
      } else if (data.acceptor.id === user!.id) {
        console.log('=== Acceptor (User B) - Setting up to receive call ===');
        console.log('Call data:', data);

        // User B (acceptor) needs to:
        // 1. Create local stream
        // 2. Listen for incoming call from User A
        // 3. Answer the call with local stream

        if (!localStream) {
          console.log('Creating local stream for acceptor');
          navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
              console.log('Local stream created for acceptor');
              debugStream(stream, 'Local (Acceptor)');
              dispatch(setLocalStream(stream));

              // Set up listener for incoming call AFTER stream is ready
              setupIncomingCallListener();
            })
            .catch((err) => {
              console.error('Failed to get local stream for acceptor:', err);
            });
        } else {
          console.log('Using existing local stream for acceptor');
          debugStream(localStream, 'Local (Acceptor)');
          setupIncomingCallListener();
        }

        function setupIncomingCallListener() {
          if (!peer) {
            console.error('Peer not initialized for acceptor');
            return;
          }

          console.log('Setting up incoming call listener for acceptor');

          // Listen for incoming call from User A
          peer.on('call', (call) => {
            console.log('Incoming call received:', call);
            console.log('Caller peer ID:', call.peer);

            // Get current local stream from Redux state
            const currentLocalStream = localStream || (store.getState() as any).call.localStream;

            if (!currentLocalStream) {
              console.error('No local stream available to answer call');
              return;
            }

            console.log('Answering call with local stream');
            debugStream(currentLocalStream, 'Local (Answering)');

            // Answer the call with local stream
            call.answer(currentLocalStream);
            dispatch(setCall(call));

            // Listen for remote stream from User A
            call.on('stream', (remoteStream) => {
              console.log('Received remote stream from caller:', remoteStream);
              debugStream(remoteStream, 'Remote (from caller)');
              dispatch(setRemoteStream(remoteStream));
            });

            call.on('error', (err) => {
              console.error('PeerJS call error (acceptor):', err);
            });

            call.on('close', () => {
              console.log('PeerJS call closed (acceptor)');
            });
          });

          console.log('Incoming call listener set up for acceptor');
        }
      }
    });
    return () => {
      socket.off('onVideoCallAccept');
    };
  }, [localStream, peer, navigate, dispatch, user]);
}
