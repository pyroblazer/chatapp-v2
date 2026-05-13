# Voice & Video Calls

## Overview

The calling feature enables one-to-one voice and video calls between users, powered by PeerJS (a WebRTC abstraction layer). Calls use peer-to-peer connections for media streaming with TURN servers for NAT traversal when direct connections are not possible. Call signaling is handled via WebSocket events.

---

## API Endpoints

There are no dedicated REST endpoints for calls. All call signaling and media negotiation is handled via WebSocket events and PeerJS's signaling server.

---

## WebSocket Events

### Call Signaling (Server-to-Client)

| Event                   | Payload                                                     | Description                              |
|-------------------------|-------------------------------------------------------------|------------------------------------------|
| `onVideoCallInitiate`   | `{ fromUserId, fromUsername, callId, peerId }`              | Incoming video call request              |
| `onVideoCallAccept`     | `{ callId, peerId }`                                        | Video call was accepted by the recipient |
| `onVideoCallHangUp`     | `{ callId }`                                                | Video call was ended                     |
| `onVoiceCallInitiate`   | `{ fromUserId, fromUsername, callId, peerId }`              | Incoming voice call request              |
| `onVoiceCallAccepted`   | `{ callId, peerId }`                                        | Voice call was accepted by the recipient |
| `onVoiceCallHangUp`     | `{ callId }`                                                | Voice call was ended                     |

### Client-to-Server Events

| Event                   | Payload                                   | Description                              |
|-------------------------|-------------------------------------------|------------------------------------------|
| `videoCallInitiate`     | `{ toUserId }`                            | Initiate a video call with a user        |
| `videoCallAccept`       | `{ callId }`                              | Accept an incoming video call            |
| `videoCallHangUp`       | `{ callId }`                              | End an active video call                 |
| `voiceCallInitiate`     | `{ toUserId }`                            | Initiate a voice call with a user        |
| `voiceCallAccept`       | `{ callId }`                              | Accept an incoming voice call            |
| `voiceCallHangUp`       | `{ callId }`                              | End an active voice call                 |

---

## WebRTC & PeerJS Flow

### Call Setup Sequence

```
Caller                              Server                          Callee
  |                                   |                               |
  |--- voiceCallInitiate ------------>|                               |
  |                                   |--- onVoiceCallInitiate ------>|
  |                                   |                               |
  |                                   |<-- voiceCallAccept -----------|
  |<-- onVoiceCallAccepted ----------|                               |
  |                                   |                               |
  |=== PeerJS P2P connection (WebRTC) =================================|
  |                                   |                               |
  |<========== Audio/Video Stream ============================>|
  |                                   |                               |
  |--- voiceCallHangUp ------------>|                               |
  |                                   |--- onVoiceCallHangUp -------->|
```

### PeerJS Configuration

PeerJS is used to simplify WebRTC peer connection setup:

```javascript
const peer = new Peer(userId, {
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      {
        urls: 'turn:turn.example.com:3478',
        username: 'username',
        credential: 'password'
      }
    ]
  }
});
```

### Media Constraints

- **Video Call**: Requests both audio and video tracks.
- **Voice Call**: Requests audio track only.

---

## NAT Traversal

WebRTC connections require STUN and TURN servers to traverse NATs and firewalls:

- **STUN Server**: Used to discover the public IP address and port. A free Google STUN server is used by default.
- **TURN Server**: Relays media traffic when a direct peer-to-peer connection cannot be established. Required for users behind symmetric NATs or strict firewalls.

### TURN Server Requirements

- Must support both UDP and TCP transport.
- Should have sufficient bandwidth for real-time media relay.
- Credentials should be provisioned per-user or per-session for security.

---

## User Guide

### Making a Voice Call

1. Open a conversation with the user you want to call.
2. Click the **Phone icon** in the top-right corner of the chat header.
3. The other user receives an incoming call notification with a ringing sound.
4. If they accept, the call connects and you can talk.

### Making a Video Call

1. Open a conversation with the user you want to call.
2. Click the **Video Camera icon** in the top-right corner of the chat header.
3. The other user receives an incoming video call notification.
4. If they accept, the call connects with both audio and video.

### Receiving a Call

When someone calls you:
- A call notification overlay appears with the caller's name and avatar.
- For video calls, you can see a preview before accepting.
- Click **Accept** (green phone) to answer or **Decline** (red phone) to reject.

### During a Call

The call interface provides the following controls:
- **Mute/Unmute** — Toggle your microphone.
- **Camera On/Off** — Toggle your webcam (video calls only).
- **Screen Share** — Share your screen (if supported).
- **Hang Up** — End the call.

### Call Quality

- Ensure you have a stable internet connection for the best experience.
- Video calls use adaptive bitrate to adjust to network conditions.
- If the connection is poor, the video may degrade to audio-only automatically.

---

## Configuration

### Environment Variables

| Variable                    | Description                                    | Default                                   |
|-----------------------------|------------------------------------------------|-------------------------------------------|
| `PEERJS_HOST`               | PeerJS signaling server host                   | `0.peerjs.com`                            |
| `PEERJS_PORT`               | PeerJS signaling server port                   | `443`                                     |
| `PEERJS_PATH`               | PeerJS signaling server path                   | `/`                                       |
| `STUN_SERVER_URL`           | STUN server URL                                | `stun:stun.l.google.com:19302`            |
| `TURN_SERVER_URL`           | TURN server URL                                | Required for production                   |
| `TURN_SERVER_USERNAME`      | TURN server username                           | Required for production                   |
| `TURN_SERVER_CREDENTIAL`    | TURN server credential                         | Required for production                   |
| `CALL_TIMEOUT_MS`           | Time before an unanswered call auto-cancels    | `30000`                                   |
