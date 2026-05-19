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
import Peer from 'peerjs';
import { AuthContext } from '../utils/context/AuthContext';
import { getAccessToken } from '../utils/api';
import {
  setCall,
  setIsCallInProgress,
  setIsReceivingCall,
  setLocalStream,
  setPeer,
  setRemoteStream,
  setCallError,
} from '../store/call/callSlice';
import { CallReceiveDialog } from '../components/calls/CallReceiveDialog';
import { CallBusyDialog } from '../components/calls/CallBusyDialog';
import { TwoWayCallUI } from '../components/calls/TwoWayCallUI';
import { MediaConnection } from 'peerjs';
import { store } from '../store';
import { useVideoCallRejected } from '../utils/hooks/sockets/useVideoCallRejected';
import { useVideoCallHangUp } from '../utils/hooks/sockets/useVideoCallHangUp';
import { useVideoCallAccept } from '../utils/hooks/sockets/useVideoCallAccept';
import { useFriendRequestReceived } from '../utils/hooks/sockets/friend-requests/useFriendRequestReceived';
import { useVideoCall } from '../utils/hooks/sockets/call/useVideoCall';
import { useVoiceCall } from '../utils/hooks/sockets/call/useVoiceCall';
import { useVoiceCallAccepted } from '../utils/hooks/sockets/call/useVoiceCallAccepted';
import { useVoiceCallHangUp } from '../utils/hooks/sockets/call/useVoiceCallHangUp';
import { useVoiceCallRejected } from '../utils/hooks/sockets/call/useVoiceCallRejected';

export const AppPage = () => {
  const { user } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { peer, call, isReceivingCall, caller, connection, isCallInProgress, localStream, remoteStream, callType } =
    useSelector((state: RootState) => state.call);
  const { info } = useToast({ theme: 'dark' });
  const { theme } = useSelector((state: RootState) => state.settings);
  const storageTheme = localStorage.getItem('theme') as SelectableTheme;
  useEffect(() => {
    dispatch(fetchFriendRequestThunk());
  }, [dispatch]);

  useEffect(() => {
    if (!user) return;

    let currentPeer: Peer | null = null;

    const initializePeer = async () => {
      try {
        // Fetch TURN credentials from backend
        const token = getAccessToken();
        const response = await fetch(`${import.meta.env.VITE_API_URL}/webrtc/turn-credentials`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.error('Failed to fetch TURN credentials:', response.statusText);
          // Fallback to default STUN servers only
          const fallbackPeer = new Peer(undefined, {
            config: {
              iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
              ],
            },
          });

          fallbackPeer.on('open', (id) => {
            console.log('PeerJS connection established with fallback config:', id);
          });

          fallbackPeer.on('error', (err) => {
            console.error('PeerJS connection error:', err);
          });

          currentPeer = fallbackPeer;
          dispatch(setPeer(fallbackPeer));
          return;
        }

        const { iceServers } = await response.json();

        // Use the database peer ID from the user object
        const peerId = user.peer?.id;
        if (!peerId) {
          console.error('No peer ID found for user');
          return;
        }

        const newPeer = new Peer(peerId, { config: { iceServers } });

        newPeer.on('open', (id) => {
          console.log('PeerJS connection established with ID:', id);
        });

        newPeer.on('error', (err) => {
          console.error('PeerJS connection error:', err);
          // If peer ID is already in use, destroy and attempt reconnection
          if (err.type === 'peer-unavailable') {
            console.log('Peer ID already in use, attempting to reconnect...');
            if (newPeer && !newPeer.destroyed) {
              newPeer.destroy();
            }
          }
        });

        currentPeer = newPeer;
        dispatch(setPeer(newPeer));
      } catch (error) {
        console.error('Failed to initialize PeerJS:', error);
      }
    };

    initializePeer();

    return () => {
      if (currentPeer && !currentPeer.destroyed) {
        currentPeer.destroy();
      }
    };
  }, [user, dispatch]);

  useFriendRequestReceived();
  useVideoCall();

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
  }, [socket, isReceivingCall]);

  /**
   * This useEffect hook is for the user who is receiving the call.
   * So we must dispatch the appropriate actions to set the state
   * for the user receiving the call.
   *
   * The user who is calling will have its own instance of MediaConnection/Call
   */
  useEffect(() => {
    if (!peer) return;

    const handleIncomingCall = async (incomingCall: MediaConnection) => {
      try {
        console.log('=== Incoming Call ===');

        // CRITICAL: Set isCallInProgress AND call object BEFORE getting stream
        // This ensures the UI renders immediately
        dispatch(setCall(incomingCall));
        dispatch(setIsCallInProgress(true));
        dispatch(setIsReceivingCall(false));

        // Get current callType from Redux to avoid stale closure
        const currentCallType = store.getState().call.callType;

        const constraints = {
          video: currentCallType === 'video',
          audio: true
        };

        console.log('Getting user media with constraints:', constraints);

        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          console.log('Got local stream:', stream);
        } catch (mediaError: any) {
          console.error('Failed to get media stream:', mediaError);

          // Handle specific error types
          if (mediaError.name === 'NotAllowedError') {
            dispatch(setCallError('Permission denied. Please allow camera/microphone access.'));
          } else if (mediaError.name === 'NotFoundError') {
            dispatch(setCallError('No camera or microphone found.'));
          } else if (mediaError.name === 'NotReadableError') {
            dispatch(setCallError('Camera/microphone is already in use by another application.'));
          } else {
            dispatch(setCallError(`Failed to access media: ${mediaError.message}`));
          }

          // Still answer the call with audio-only if video failed
          try {
            const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
              video: false,
              audio: true
            });
            incomingCall.answer(audioOnlyStream);
            dispatch(setLocalStream(audioOnlyStream));
            console.log('Answered with audio-only stream');

            // Attach stream listener for audio-only call
            incomingCall.on('stream', (remoteStream) => {
              console.log('Received remote stream:', remoteStream);
              dispatch(setRemoteStream(remoteStream));
            });

            incomingCall.on('error', (err) => {
              console.error('WebRTC call error:', err);
            });

            return;
          } catch (audioError) {
            console.error('Failed to get audio stream:', audioError);
            // If audio also fails, answer without stream
            incomingCall.answer();
            dispatch(setCallError('Could not access camera or microphone. Call will continue without media.'));
            return;
          }
        }

        // Answer with our local stream
        incomingCall.answer(stream);
        dispatch(setLocalStream(stream));

        console.log('Answered incoming call');

        // IMMEDIATELY attach stream listener
        incomingCall.on('stream', (remoteStream) => {
          console.log('Received remote stream:', remoteStream);
          dispatch(setRemoteStream(remoteStream));
        });

        // Handle errors
        incomingCall.on('error', (err) => {
          console.error('WebRTC call error:', err);
        });

      } catch (err) {
        console.error('Failed to get media stream:', err);
      }
    };

    peer.on('call', handleIncomingCall);

    return () => {
      peer.off('call', handleIncomingCall);
    };
  }, [peer, dispatch]);

  useVideoCallAccept();
  useVideoCallRejected();
  useVideoCallHangUp();
  useVoiceCall();
  useVoiceCallAccepted();
  useVoiceCallHangUp();
  useVoiceCallRejected();

  useEffect(() => {
    if (connection) {
        connection.on('open', () => {
        });
        connection.on('error', () => {
        });
        connection.on('data', (data) => {
        });
        connection.on('close', () => {
        });
      }
      return () => {
        connection?.off('open');
        connection?.off('error');
        connection?.off('data');
      };
  }, [connection]);

  return (
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
      {isReceivingCall && caller && !isCallInProgress && <CallReceiveDialog />}
      <CallBusyDialog />
      {isCallInProgress && <TwoWayCallUI />}
      <LayoutPage>
        <UserSidebar />
        <Outlet />
      </LayoutPage>
    </ThemeProvider>
  );
};
