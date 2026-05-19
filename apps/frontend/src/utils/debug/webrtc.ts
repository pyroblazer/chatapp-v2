// WebRTC Debug Utilities

export const debugWebRTC = () => {
  // Log PeerJS state
  console.log('=== WebRTC Debug Info ===');

  // Check browser support
  console.log('WebRTC Support:', {
    getUserMedia: !!navigator.mediaDevices?.getUserMedia,
    RTCPeerConnection: !!window.RTCPeerConnection,
    PeerJS: !!(window as any).Peer,
  });

  // Check permissions
  if (navigator.permissions) {
    navigator.permissions.query({ name: 'camera' as PermissionName })
      .then(result => console.log('Camera permission:', result.state))
      .catch(err => console.log('Camera permission check failed:', err));

    navigator.permissions.query({ name: 'microphone' as PermissionName })
      .then(result => console.log('Microphone permission:', result.state))
      .catch(err => console.log('Microphone permission check failed:', err));
  }
};

export const debugStream = (stream: MediaStream, label: string) => {
  console.log(`=== ${label} Stream Debug ===`);
  console.log('ID:', stream.id);
  console.log('Tracks:', stream.getTracks().map(track => ({
    kind: track.kind,
    enabled: track.enabled,
    muted: track.muted,
    id: track.id,
  })));
};

export const debugPeer = (peer: any) => {
  console.log('=== PeerJS Debug ===');
  console.log('Peer ID:', peer?.id);
  console.log('Peer destroyed:', peer?.destroyed);
  console.log('Peer connections:', peer?.connections);
  console.log('Peer active calls:', Object.keys(peer?.calls || {}));
};

export const debugCallState = (state: any) => {
  console.log('=== Call State Debug ===');
  console.log('isCallInProgress:', state.isCallInProgress);
  console.log('isReceivingCall:', state.isReceivingCall);
  console.log('callType:', state.callType);
  console.log('hasLocalStream:', !!state.localStream);
  console.log('hasRemoteStream:', !!state.remoteStream);
  console.log('hasPeer:', !!state.peer);
  console.log('hasCall:', !!state.call);
  console.log('caller:', state.caller?.username);
  console.log('receiver:', state.receiver?.username);
};