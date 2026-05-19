import { useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../../../store';
import { store } from '../../../../store';
import {
  setActiveConversationId,
  setCall,
  setConnection,
  setIsCallInProgress,
  setIsReceivingCall,
  setRemoteStream,
  setLocalStream,
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
          console.log('=== Caller (User A) - Initiating Voice Call ===');
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
        } else if (data.acceptor.id === user!.id) {
          console.log('=== Acceptor (User B) - Setting up to receive voice call ===');
          console.log('Call data:', data);

          // User B (acceptor) needs to:
          // 1. Create local stream
          // 2. Listen for incoming call from User A
          // 3. Answer the call with local stream

          if (!localStream) {
            console.log('Creating local stream for voice acceptor');
            navigator.mediaDevices.getUserMedia({ video: false, audio: true })
              .then((stream) => {
                console.log('Local voice stream created for acceptor');
                debugStream(stream, 'Local Voice (Acceptor)');
                dispatch(setLocalStream(stream));

                // Set up listener for incoming call AFTER stream is ready
                setupIncomingCallListener();
              })
              .catch((err) => {
                console.error('Failed to get local voice stream for acceptor:', err);
              });
          } else {
            console.log('Using existing local stream for voice acceptor');
            debugStream(localStream, 'Local Voice (Acceptor)');
            setupIncomingCallListener();
          }

          function setupIncomingCallListener() {
            if (!peer) {
              console.error('Peer not initialized for voice acceptor');
              return;
            }

            console.log('Setting up incoming voice call listener for acceptor');

            // Listen for incoming call from User A
            peer.on('call', (call) => {
              console.log('Incoming voice call received:', call);
              console.log('Caller peer ID:', call.peer);

              // Get current local stream from Redux state
              const currentLocalStream = localStream || (store.getState() as any).call.localStream;

              if (!currentLocalStream) {
                console.error('No local voice stream available to answer call');
                return;
              }

              console.log('Answering voice call with local stream');
              debugStream(currentLocalStream, 'Local Voice (Answering)');

              // Answer the call with local stream
              call.answer(currentLocalStream);
              dispatch(setCall(call));

              // Listen for remote stream from User A
              call.on('stream', (remoteStream) => {
                console.log('Received remote voice stream from caller:', remoteStream);
                debugStream(remoteStream, 'Remote Voice (from caller)');
                dispatch(setRemoteStream(remoteStream));
              });

              call.on('error', (err) => {
                console.error('PeerJS call error (voice acceptor):', err);
              });

              call.on('close', () => {
                console.log('PeerJS voice call closed (acceptor)');
              });
            });

            console.log('Incoming voice call listener set up for acceptor');
          }
        }
      }
    );

    return () => {
      socket.off(WebsocketEvents.VOICE_CALL_ACCEPTED);
    };
  }, [localStream, peer, navigate, dispatch, user]);
}
