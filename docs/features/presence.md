# Presence (Online/Offline Status)

## Overview

User presence is tracked in real-time via Redis pub/sub. When a user connects via WebSocket, their status becomes online. When they disconnect, they are marked offline after a short grace period. Users can set custom status messages and choose to appear offline. Presence data is shared across all connected server instances via the Redis adapter.

---

## API Endpoints

### Update Presence Settings

```
PATCH /api/users/presence/status
```

Updates the authenticated user's presence status message and visibility preference.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

| Field           | Type    | Required | Description                            |
|-----------------|---------|----------|----------------------------------------|
| `statusMessage` | string  | No       | Custom status text (max 100 chars)     |
| `showOffline`   | boolean | No       | Whether to appear offline to others    |

**Response (200):**

```json
{
  "statusMessage": "In a meeting",
  "showOffline": false
}
```

**Error Responses:**

- `401` — Not authenticated

---

### Get Current User's Presence

```
GET /api/users/presence
```

Returns the authenticated user's current presence settings and real-time status.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200):**

```json
{
  "status": "online",
  "statusMessage": "In a meeting",
  "showOffline": false,
  "lastSeen": "2025-06-10T14:30:00Z"
}
```

**Error Responses:**

- `401` — Not authenticated

---

### Get Online Friends

```
GET /api/friends/online
```

Returns the list of friends currently online. Respects each friend's `showOffline` setting — users who have enabled "appear offline" are excluded from results.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200):**

```json
[
  {
    "id": "550e8400-...",
    "username": "alice",
    "statusMessage": "Available",
    "profile": { "avatar": "..." }
  }
]
```

**Error Responses:**

- `401` — Not authenticated

---

## WebSocket Events

### Presence Update

Emitted to all friends and group members when a user's presence changes:

```javascript
socket.on('onPresenceUpdate', (data) => {
  // data: {
  //   userId: "550e8400-e29b-41d4-a716-446655440000",
  //   status: "online",
  //   statusMessage: "In a meeting"
  // }
});
```

The `status` field is one of: `online`, `offline`, or `away`.

---

### Get Online Friends (WebSocket)

```javascript
socket.emit('getOnlineFriends', (onlineFriends) => {
  // onlineFriends: Array of currently online friend user objects
});
```

---

### Get Online Group Members (WebSocket)

```javascript
socket.emit('getOnlineGroupUsers', { groupId: 'uuid' }, (onlineUsers) => {
  // onlineUsers: Array of currently online group member user objects
});
```

---

## Status Indicators

| Indicator    | Meaning                                           |
|--------------|---------------------------------------------------|
| Green dot    | Online and active (WebSocket connected)           |
| Yellow dot   | Away (no activity for 5 minutes)                  |
| Gray dot     | Offline or appearing offline                      |
| Custom text  | User-set status message displayed below username  |

### Status Lifecycle

1. **Connect**: User opens the app → WebSocket connects → status becomes `online`
2. **Idle**: No activity for 5 minutes → status becomes `away`
3. **Disconnect**: User closes the app → status becomes `offline`
4. **Appear Offline**: User enables `showOffline` → status reported as `offline` to others regardless of connection state

---

## Presence and Redis

Presence is tracked using the WebSocket session manager backed by Redis pub/sub:

- **Session store**: Active WebSocket connections are tracked per user ID
- **Pub/sub**: Presence changes are broadcast to all server instances via the Redis adapter
- **Grace period**: Disconnections have a brief grace period to prevent flickering during reconnects
- **Multi-instance**: When running multiple backend instances, presence stays consistent across all nodes

---

## User Guide

1. Your online status is shown automatically based on your WebSocket connection
2. **Set a custom status**: Click your avatar → "Set Status" → type a message → press Enter
3. **Appear offline**: Click your avatar → toggle "Appear Offline" — others see you as offline
4. Friends see your status next to your name in their friends list
5. Group members see online indicators in the group sidebar
6. Your status message appears below your name in conversations

---

## Configuration

### Environment Variables

| Variable      | Description                         | Default       |
|---------------|-------------------------------------|---------------|
| `REDIS_HOST`  | Redis server hostname               | `localhost`   |
| `REDIS_PORT`  | Redis server port                   | `6379`        |
