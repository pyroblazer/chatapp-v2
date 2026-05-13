# Reactions

## Overview

Reactions allow users to respond to individual messages with emoji. Each user can add one reaction per emoji per message. Reactions are displayed beneath the message and are updated in real time via WebSocket events.

---

## API Endpoints

### Add Reaction

```
POST /api/messages/:id/reactions
```

Adds an emoji reaction to a message. If the user already has this emoji reaction on the message, the request is idempotent (no duplicate is created).

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

| Field    | Type   | Required | Description                              |
|----------|--------|----------|------------------------------------------|
| `emoji`  | string | Yes      | The emoji character (e.g., "👍", "❤️")   |

**Response (200):**

```json
{
  "messageId": "msg-100",
  "emoji": "👍",
  "userId": "user-001",
  "username": "alice",
  "createdAt": "2025-03-10T14:40:00Z"
}
```

**Error Responses:**

- `400` — Missing or invalid emoji
- `403` — No access to the conversation/group containing this message
- `404` — Message not found

---

### Remove Reaction

```
DELETE /api/messages/:id/reactions/:emoji
```

Removes the authenticated user's emoji reaction from a message.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200):**

```json
{
  "message": "Reaction removed"
}
```

**Error Responses:**

- `403` — No access to the conversation/group containing this message
- `404` — Message not found, or reaction does not exist

---

## WebSocket Events

### Server-to-Client Events

| Event              | Payload                                                    | Description                      |
|--------------------|------------------------------------------------------------|----------------------------------|
| `onReactionAdd`    | `{ messageId, emoji, userId, username }`                   | A reaction was added to a message|
| `onReactionRemove` | `{ messageId, emoji, userId }`                             | A reaction was removed           |

Both events are emitted to all users who have access to the conversation or group containing the message.

---

## User Guide

### Adding a Reaction

1. Hover over any message in a conversation or group.
2. Click the **smiley face icon** that appears near the message.
3. Select an emoji from the reaction picker.
4. The reaction appears beneath the message.

### Viewing Reactions

Reactions are displayed as emoji badges below the message, along with the count of users who reacted. Hover over a reaction badge to see which users reacted.

### Removing Your Reaction

1. Hover over the message with your reaction.
2. Click the highlighted reaction badge beneath the message.
3. Your reaction is removed. If other users also reacted with the same emoji, the count decreases. If you were the only one, the badge disappears.

### Quick React

Double-click (or double-tap) a message to quickly add a default reaction (thumbs up). This shortcut can be used as a fast acknowledgment.

---

## Configuration

### Environment Variables

| Variable               | Description                                      | Default |
|------------------------|--------------------------------------------------|---------|
| `MAX_REACTIONS_PER_MSG`| Maximum distinct emojis per message               | `20`    |
| `ALLOWED_EMOJI_SET`    | Restrict reactions to a specific set (comma-separated, or `all`) | `all` |
