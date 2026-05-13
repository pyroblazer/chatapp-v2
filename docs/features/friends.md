# Friends

## Overview

The friends system manages social connections between users. Users can send, accept, reject, and cancel friend requests. Once accepted, friends can start direct conversations and see each other's presence status. Friend requests are delivered in real time via WebSocket events.

---

## API Endpoints

### Get Friends

```
GET /api/friends
```

Returns the authenticated user's friends list.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200):**

```json
{
  "friends": [
    {
      "id": "user-002",
      "username": "bob",
      "avatar": "https://minio.example.com/avatars/bob.png",
      "status": "online",
      "statusMessage": "Available"
    },
    {
      "id": "user-003",
      "username": "carol",
      "avatar": null,
      "status": "offline",
      "statusMessage": null
    }
  ]
}
```

---

### Remove Friend

```
DELETE /api/friends
```

Removes a user from the authenticated user's friends list. This is a mutual action: the friendship is removed for both users.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

| Field     | Type   | Required | Description                       |
|-----------|--------|----------|-----------------------------------|
| `userId`  | string | Yes      | UUID of the friend to remove      |

**Response (200):**

```json
{
  "message": "Friend removed"
}
```

**Error Responses:**

- `404` — User is not in your friends list

---

### Get Friend Requests

```
GET /api/friends/requests
```

Returns pending friend requests, both sent and received.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200):**

```json
{
  "sent": [
    {
      "id": "fr-001",
      "to": { "id": "user-005", "username": "eve", "avatar": "..." },
      "status": "pending",
      "createdAt": "2025-03-09T10:00:00Z"
    }
  ],
  "received": [
    {
      "id": "fr-002",
      "from": { "id": "user-006", "username": "frank", "avatar": "..." },
      "status": "pending",
      "createdAt": "2025-03-10T08:00:00Z"
    }
  ]
}
```

---

### Create Friend Request

```
POST /api/friends/requests
```

Sends a friend request to another user. The recipient receives a real-time notification via WebSocket.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

| Field     | Type   | Required | Description                         |
|-----------|--------|----------|-------------------------------------|
| `userId`  | string | Yes      | UUID of the user to befriend        |

**Response (201):**

```json
{
  "id": "fr-003",
  "from": { "id": "user-001", "username": "alice" },
  "to": { "id": "user-005", "username": "eve" },
  "status": "pending",
  "createdAt": "2025-03-10T15:00:00Z"
}
```

**Error Responses:**

- `400` — Missing `userId`
- `404` — Target user not found
- `409` — Friend request already exists, or users are already friends

---

### Accept or Reject Friend Request

```
PATCH /api/friends/requests/:id
```

Accepts or rejects a received friend request. Only the recipient can perform this action.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

| Field     | Type   | Required | Description                                |
|-----------|--------|----------|--------------------------------------------|
| `status`  | string | Yes      | `"accepted"` or `"rejected"`               |

**Response (200):**

```json
{
  "id": "fr-002",
  "status": "accepted",
  "friend": {
    "id": "user-006",
    "username": "frank",
    "avatar": "..."
  }
}
```

**Error Responses:**

- `400` — Invalid status value
- `403` — Not the recipient of this request
- `404` — Friend request not found

---

### Cancel Friend Request

```
DELETE /api/friends/requests/:id
```

Cancels a pending friend request. Only the sender can cancel.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200):**

```json
{
  "message": "Friend request cancelled"
}
```

**Error Responses:**

- `403` — Not the sender of this request
- `404` — Friend request not found

---

## WebSocket Events

### Server-to-Client Events

| Event                        | Payload                                              | Description                           |
|------------------------------|------------------------------------------------------|---------------------------------------|
| `onFriendRequestReceived`    | `{ id, from: { id, username, avatar } }`             | You received a friend request         |
| `onFriendRequestAccepted`    | `{ id, friend: { id, username, avatar } }`           | Your friend request was accepted      |
| `onFriendRequestRejected`    | `{ id }`                                             | Your friend request was rejected      |
| `onFriendRemoved`            | `{ userId }`                                         | A friend removed you                  |

---

## User Guide

### Adding a Friend

1. Click the **Add Friend** button in the sidebar or navigate to the friends tab.
2. Search for a user by their username.
3. Click **Send Friend Request**.
4. The user receives a notification and can accept or reject the request.

### Responding to Friend Requests

1. When you receive a friend request, a notification badge appears on the **Friends** tab.
2. Navigate to the **Friends** tab and select **Pending Requests**.
3. Click **Accept** or **Reject** on the request.

### Viewing Your Friends List

1. Open the **Friends** tab in the sidebar.
2. Your friends are listed alphabetically with their online status indicators.
3. Click a friend to open a direct conversation.

### Removing a Friend

1. Open the **Friends** tab.
2. Right-click (or long-press) on a friend's name.
3. Select **Remove Friend**.
4. Confirm the removal. The friendship is removed for both users.

### Cancelling a Sent Request

1. Open the **Friends** tab and select **Sent Requests**.
2. Find the pending request and click **Cancel**.
3. The request is withdrawn and the other user no longer sees it.

---

## Configuration

### Environment Variables

| Variable                      | Description                                    | Default |
|-------------------------------|------------------------------------------------|---------|
| `MAX_FRIENDS`                 | Maximum friends per user                       | `1000`  |
| `MAX_PENDING_REQUESTS`        | Maximum outgoing pending friend requests       | `50`    |
| `FRIEND_REQUEST_EXPIRY_DAYS`  | Days before a pending request auto-expires     | `30`    |
