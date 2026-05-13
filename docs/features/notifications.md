# Notifications

## Overview

The notification system keeps users informed about relevant activity across the application. Notifications are generated for new messages, friend requests, group invitations, reactions, mentions, and thread replies. Notifications are delivered in real time via WebSocket and can be queried and managed through the REST API.

---

## API Endpoints

### Get Notifications

```
GET /api/notifications
```

Returns a paginated list of notifications for the authenticated user, ordered by creation time (newest first).

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Query Parameters:**

| Parameter | Type   | Default | Description                          |
|-----------|--------|---------|--------------------------------------|
| `limit`   | number | 20      | Notifications per page               |
| `offset`  | number | 0       | Number of results to skip            |
| `unread`  | boolean| -       | Filter to unread only                |

**Response (200):**

```json
{
  "notifications": [
    {
      "id": "notif-001",
      "type": "NEW_MESSAGE",
      "title": "New message from Bob",
      "body": "Hey, are you coming to the meeting?",
      "data": {
        "conversationId": "conv-001",
        "messageId": "msg-110",
        "senderId": "user-002"
      },
      "read": false,
      "createdAt": "2025-03-10T15:00:00Z"
    },
    {
      "id": "notif-002",
      "type": "FRIEND_REQUEST",
      "title": "Friend request from Carol",
      "body": "carol sent you a friend request",
      "data": {
        "requestId": "fr-010",
        "fromUserId": "user-003"
      },
      "read": false,
      "createdAt": "2025-03-10T14:30:00Z"
    }
  ],
  "total": 15,
  "unreadCount": 4,
  "hasMore": true
}
```

---

### Mark Notification as Read

```
PATCH /api/notifications/:id/read
```

Marks a single notification as read.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200):**

```json
{
  "id": "notif-001",
  "read": true
}
```

**Error Responses:**

- `404` — Notification not found

---

### Mark All Notifications as Read

```
PATCH /api/notifications/read-all
```

Marks all unread notifications for the authenticated user as read.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200):**

```json
{
  "message": "All notifications marked as read",
  "updatedCount": 4
}
```

---

## Notification Types

| Type              | Description                                   | Data Fields                                       |
|-------------------|-----------------------------------------------|---------------------------------------------------|
| `NEW_MESSAGE`     | New message in a conversation or group        | `conversationId`, `messageId`, `senderId`         |
| `FRIEND_REQUEST`  | Someone sent you a friend request             | `requestId`, `fromUserId`                         |
| `GROUP_INVITE`    | You were added to a group                     | `groupId`, `addedByUserId`                        |
| `REACTION`        | Someone reacted to your message               | `messageId`, `emoji`, `userId`                    |
| `MENTION`         | You were @mentioned in a message              | `messageId`, `conversationId`, `mentionedByUserId`|
| `THREAD_REPLY`    | Someone replied in your thread                | `parentMessageId`, `replyId`, `userId`            |

---

## WebSocket Events

### Server-to-Client Events

| Event           | Payload                                                       | Description                           |
|-----------------|---------------------------------------------------------------|---------------------------------------|
| `onNotification`| `{ id, type, title, body, data, read, createdAt }`            | A new notification was generated      |

The `onNotification` event is pushed in real time so the client can display a toast, update a badge counter, or play a sound without needing to poll the REST endpoint.

---

## User Guide

### Viewing Notifications

1. Click the **bell icon** in the top navigation bar.
2. A dropdown panel shows your recent notifications.
3. Unread notifications are highlighted with a visual indicator.
4. The bell icon displays a badge with the unread count.

### Notification Categories

Each notification type has a distinct icon:
- **Message** — Chat bubble icon
- **Friend Request** — User plus icon
- **Group Invite** — Users/group icon
- **Reaction** — Emoji icon
- **Mention** — @ symbol icon
- **Thread Reply** — Reply arrow icon

### Acting on Notifications

- Click a notification to navigate to the relevant conversation, friend request, or group.
- **Friend Request** notifications include inline **Accept/Reject** buttons.
- **Mention** notifications take you directly to the message where you were mentioned.

### Marking as Read

- Clicking a notification automatically marks it as read.
- To mark all as read at once, click **Mark All as Read** at the top of the notification panel.

### Notification Sounds

A short sound plays when a new notification arrives while the app is in the foreground. To manage sound preferences:
1. Go to **Settings**.
2. Navigate to **Notifications**.
3. Toggle **Notification Sounds** on or off.

---

## Configuration

### Environment Variables

| Variable                       | Description                                    | Default |
|--------------------------------|------------------------------------------------|---------|
| `NOTIFICATIONS_PER_PAGE`       | Default notifications returned per request     | `20`    |
| `NOTIFICATION_MAX_AGE_DAYS`    | Days before old notifications are auto-deleted | `90`    |
| `NOTIFICATION_SOUNDS_ENABLED`  | Default sound setting for new users            | `true`  |
