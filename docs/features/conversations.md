# Conversations & Messages

## Overview

Conversations are the core communication unit in the application. Each conversation is a direct message thread between two users. Messages within conversations support creation, editing, deletion, and real-time delivery via WebSocket events.

---

## API Endpoints

### Get Conversations

```
GET /api/conversations
```

Returns a paginated list of conversations for the authenticated user, ordered by most recent message.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Query Parameters:**

| Parameter | Type   | Default | Description                      |
|-----------|--------|---------|----------------------------------|
| `limit`   | number | 20      | Results per page                 |
| `offset`  | number | 0       | Number of results to skip        |

**Response (200):**

```json
{
  "conversations": [
    {
      "id": "conv-001",
      "participants": [
        { "id": "user-001", "username": "alice", "avatar": "..." },
        { "id": "user-002", "username": "bob", "avatar": "..." }
      ],
      "lastMessage": {
        "id": "msg-100",
        "content": "Hey, how are you?",
        "senderId": "user-002",
        "createdAt": "2025-03-10T14:30:00Z"
      },
      "unreadCount": 3,
      "createdAt": "2025-02-01T09:00:00Z",
      "updatedAt": "2025-03-10T14:30:00Z"
    }
  ],
  "total": 42,
  "hasMore": true
}
```

---

### Create Conversation

```
POST /api/conversations
```

Creates a new conversation with another user. Returns the existing conversation if one already exists between the two users.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

| Field           | Type   | Required | Description                    |
|-----------------|--------|----------|--------------------------------|
| `recipientId`   | string | Yes      | UUID of the user to chat with  |

**Response (201):**

```json
{
  "id": "conv-001",
  "participants": [
    { "id": "user-001", "username": "alice", "avatar": "..." },
    { "id": "user-002", "username": "bob", "avatar": "..." }
  ],
  "lastMessage": null,
  "createdAt": "2025-03-10T14:00:00Z",
  "updatedAt": "2025-03-10T14:00:00Z"
}
```

**Error Responses:**

- `400` — Missing `recipientId`
- `404` — Recipient user not found
- `409` — Cannot create conversation with yourself

---

### Get Messages

```
GET /api/conversations/:id/messages
```

Retrieves messages for a specific conversation, ordered by creation time (newest first).

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Query Parameters:**

| Parameter | Type   | Default | Description                       |
|-----------|--------|---------|-----------------------------------|
| `limit`   | number | 50      | Messages per page                 |
| `before`  | string | -       | Cursor: get messages older than this message ID |

**Response (200):**

```json
{
  "messages": [
    {
      "id": "msg-100",
      "content": "Hey, how are you?",
      "senderId": "user-002",
      "conversationId": "conv-001",
      "editedAt": null,
      "reactions": [],
      "replyTo": null,
      "createdAt": "2025-03-10T14:30:00Z"
    }
  ],
  "hasMore": true
}
```

**Error Responses:**

- `403` — Not a participant in this conversation
- `404` — Conversation not found

---

### Create Message

```
POST /api/conversations/:id/messages
```

Sends a new message in a conversation. The message is broadcast to the other participant via WebSocket.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

| Field      | Type   | Required | Description                          |
|------------|--------|----------|--------------------------------------|
| `content`  | string | Yes      | Message text (max 4000 characters)   |

**Response (201):**

```json
{
  "id": "msg-101",
  "content": "I'm doing great, thanks!",
  "senderId": "user-001",
  "conversationId": "conv-001",
  "editedAt": null,
  "reactions": [],
  "replyTo": null,
  "createdAt": "2025-03-10T14:35:00Z"
}
```

**Error Responses:**

- `400` — Empty or missing content
- `403` — Not a participant in this conversation
- `404` — Conversation not found

---

### Edit Message

```
PATCH /api/conversations/:id/messages/:messageId
```

Edits the content of a message you previously sent. Edited messages display an "edited" indicator in the UI.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

| Field      | Type   | Required | Description                     |
|------------|--------|----------|---------------------------------|
| `content`  | string | Yes      | Updated message text            |

**Response (200):**

```json
{
  "id": "msg-101",
  "content": "I'm doing great, thanks for asking!",
  "senderId": "user-001",
  "conversationId": "conv-001",
  "editedAt": "2025-03-10T14:36:00Z",
  "reactions": [],
  "createdAt": "2025-03-10T14:35:00Z"
}
```

**Error Responses:**

- `403` — Not the message author
- `404` — Message not found

---

### Delete Message

```
DELETE /api/conversations/:id/messages/:messageId
```

Deletes a message. Only the message author can delete their own messages. The deletion is broadcast to other participants via WebSocket.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200):**

```json
{
  "message": "Message deleted"
}
```

**Error Responses:**

- `403` — Not the message author
- `404` — Message not found

---

## WebSocket Events

All conversation-related WebSocket events require an authenticated socket connection.

### Client-to-Server Events

| Event          | Payload                                      | Description                        |
|----------------|----------------------------------------------|------------------------------------|
| `typingStart`  | `{ conversationId }`                         | Indicates the user is typing       |
| `typingStop`   | `{ conversationId }`                         | Indicates the user stopped typing  |

### Server-to-Client Events

| Event             | Payload                                             | Description                              |
|-------------------|-----------------------------------------------------|------------------------------------------|
| `onMessage`       | `{ id, content, senderId, conversationId, ... }`    | New message received in a conversation   |
| `onConversation`  | `{ id, participants, lastMessage, ... }`            | New conversation created or updated      |
| `onMessageDelete` | `{ messageId, conversationId }`                     | A message was deleted                    |
| `onMessageUpdate` | `{ id, content, editedAt, conversationId, ... }`    | A message was edited                     |
| `onTypingStart`   | `{ userId, username, conversationId }`              | Another user started typing              |
| `onTypingStop`    | `{ userId, conversationId }`                        | Another user stopped typing              |

---

## User Guide

### Starting a New Conversation

1. Click the **New Message** button (pencil icon) in the sidebar.
2. Search for or select a user from your friends list.
3. Type your message and press **Enter** or click **Send**.
4. The conversation appears in your sidebar.

### Viewing Conversations

All your conversations are listed in the left sidebar, ordered by the most recent message. Unread conversations display a badge with the unread message count.

### Sending Messages

1. Select a conversation from the sidebar.
2. Type your message in the input field at the bottom of the chat area.
3. Press **Enter** to send, or **Shift+Enter** for a new line.
4. Your message appears immediately with a delivery indicator.

### Editing Messages

1. Hover over a message you sent.
2. Click the **three-dot menu** that appears.
3. Select **Edit**.
4. Modify the message text and press **Enter** to save.
5. The message now shows an "(edited)" label.

### Deleting Messages

1. Hover over a message you sent.
2. Click the **three-dot menu**.
3. Select **Delete**.
4. Confirm the deletion. The message is removed for all participants.

### Typing Indicators

When another user is typing a message in your active conversation, you will see a "User is typing..." indicator below the chat area. This indicator disappears after they stop typing or send the message.

---

## Configuration

### Environment Variables

| Variable                  | Description                                    | Default |
|---------------------------|------------------------------------------------|---------|
| `MESSAGE_MAX_LENGTH`      | Maximum characters per message                 | `4000`  |
| `MESSAGES_PER_PAGE`       | Default number of messages returned per request| `50`    |
| `CONVERSATIONS_PER_PAGE`  | Default number of conversations per request    | `20`    |
