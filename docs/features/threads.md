# Threads

## Overview

Threads allow users to reply to a specific message, creating a branched conversation. Threads keep the main conversation flow clean while enabling focused discussions on individual messages. Thread replies are displayed in a collapsible panel and are delivered in real time via WebSocket.

---

## API Endpoints

### Reply to a Message

```
POST /api/messages/:id/reply
```

Creates a threaded reply to the specified message. The reply is linked to the parent message and appears in its thread.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

| Field      | Type   | Required | Description                          |
|------------|--------|----------|--------------------------------------|
| `content`  | string | Yes      | Reply text (max 4000 characters)     |

**Response (201):**

```json
{
  "id": "msg-300",
  "content": "I agree with this point!",
  "senderId": "user-001",
  "parentMessageId": "msg-100",
  "conversationId": "conv-001",
  "editedAt": null,
  "reactions": [],
  "createdAt": "2025-03-10T15:00:00Z"
}
```

**Error Responses:**

- `400` — Missing content
- `403` — No access to the conversation containing this message
- `404` — Parent message not found

---

### Get Thread

```
GET /api/messages/:id/thread
```

Retrieves all replies in the thread for the specified parent message, ordered chronologically.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Query Parameters:**

| Parameter | Type   | Default | Description                      |
|-----------|--------|---------|----------------------------------|
| `limit`   | number | 50      | Replies per page                 |
| `offset`  | number | 0       | Number of replies to skip        |

**Response (200):**

```json
{
  "parentMessage": {
    "id": "msg-100",
    "content": "What does everyone think about this proposal?",
    "senderId": "user-002",
    "createdAt": "2025-03-10T14:30:00Z"
  },
  "replies": [
    {
      "id": "msg-300",
      "content": "I agree with this point!",
      "senderId": "user-001",
      "parentMessageId": "msg-100",
      "createdAt": "2025-03-10T15:00:00Z"
    },
    {
      "id": "msg-301",
      "content": "I have some concerns about timeline.",
      "senderId": "user-003",
      "parentMessageId": "msg-100",
      "createdAt": "2025-03-10T15:05:00Z"
    }
  ],
  "total": 2,
  "hasMore": false
}
```

**Error Responses:**

- `403` — No access to the conversation
- `404` — Parent message not found

---

## WebSocket Events

### Server-to-Client Events

| Event           | Payload                                                        | Description                           |
|-----------------|----------------------------------------------------------------|---------------------------------------|
| `onThreadReply` | `{ id, content, senderId, parentMessageId, conversationId, ... }` | A new reply was posted in a thread |

This event is emitted to all participants who have access to the conversation or group containing the parent message.

---

## User Guide

### Replying in a Thread

1. Hover over the message you want to reply to.
2. Click the **Reply** icon (arrow pointing left).
3. A reply input appears, showing the original message as a quoted reference.
4. Type your reply and press **Enter** to send.
5. Your reply appears in the thread attached to that message.

### Opening a Thread

1. If a message has replies, a **thread indicator** is shown beneath it (e.g., "3 replies").
2. Click the thread indicator to open the thread panel on the right side of the screen.
3. The thread panel shows the original message at the top, followed by all replies in chronological order.

### Collapsing and Expanding Threads

- **Collapse**: Click the **X** or the thread header to close the thread panel and return to the main conversation view.
- **Expand**: Click the thread indicator on any message to expand the thread panel again.
- Thread state (open/closed) is remembered per conversation during your session.

### Thread Notifications

When someone replies to a message you sent or to a thread you participated in, you receive a notification. The notification includes the thread content and a direct link to open the thread.

---

## Configuration

### Environment Variables

| Variable              | Description                                    | Default |
|-----------------------|------------------------------------------------|---------|
| `THREAD_REPLIES_LIMIT`| Maximum replies returned per request            | `50`    |
| `THREAD_MAX_DEPTH`    | Maximum nesting depth for thread replies        | `1`     |
