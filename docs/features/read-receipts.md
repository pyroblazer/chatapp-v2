# Read Receipts

## Overview

Read receipts provide delivery and read confirmation for messages in conversations. When a recipient reads a message, the sender sees a visual indicator showing the message status. This feature helps users know whether their messages have been seen.

---

## API Endpoints

### Mark Conversation as Read

```
POST /api/conversations/:id/read
```

Marks all unread messages in the specified conversation as read by the authenticated user. This updates the unread count to zero and triggers read receipt events for the message sender(s).

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200):**

```json
{
  "conversationId": "conv-001",
  "readUpTo": "msg-105",
  "unreadCount": 0
}
```

**Error Responses:**

- `403` — Not a participant in this conversation
- `404` — Conversation not found

---

### Get Unread Count

The unread count for each conversation is returned as part of the `GET /api/conversations` response in the `unreadCount` field. There is no separate endpoint for this; it is embedded in the conversation list.

```json
{
  "conversations": [
    {
      "id": "conv-001",
      "unreadCount": 3,
      ...
    }
  ]
}
```

A total unread count across all conversations can be derived by summing `unreadCount` values from the conversation list.

---

## WebSocket Events

### Server-to-Client Events

| Event          | Payload                                              | Description                                |
|----------------|------------------------------------------------------|--------------------------------------------|
| `onMessageRead`| `{ conversationId, readByUserId, readUpTo }`         | A participant read messages in a conversation |

The `readUpTo` field contains the message ID up to which the user has read. All messages at or before this ID are considered read by that user.

---

## User Guide

### Message Status Indicators

Messages you send display a checkmark indicator that shows delivery and read status:

| Indicator                              | Meaning                                   |
|----------------------------------------|-------------------------------------------|
| Single checkmark (light gray)          | Message delivered to the server           |
| Double checkmark (light gray)          | Message delivered to the recipient        |
| Double checkmark (blue/green)          | Message has been read by the recipient    |

### How Read Receipts Work

1. When you send a message, a single gray checkmark appears immediately.
2. Once the message reaches the recipient's device, the indicator changes to a double gray checkmark.
3. When the recipient opens the conversation and the message is visible, the indicator changes to a double colored checkmark.

### Marking Messages as Read

Messages are automatically marked as read when you open a conversation and the messages are displayed on screen. There is no manual action required.

### Disabling Read Receipts

If you prefer not to send read receipts:
1. Go to **Settings**.
2. Navigate to **Privacy**.
3. Toggle off **Send Read Receipts**.
4. When disabled, others will not see the double colored checkmark for messages they send you, and you will not send `onMessageRead` events.

---

## Configuration

### Environment Variables

| Variable                    | Description                                    | Default |
|-----------------------------|------------------------------------------------|---------|
| `READ_RECEIPTS_ENABLED`     | Globally enable/disable read receipts          | `true`  |
| `READ_RECEIPT_BATCH_MS`     | Milliseconds to batch read receipt updates     | `1000`  |
