# Groups

## Overview

Groups enable multi-user conversations with more than two participants. Each group has an owner, a name, and a list of recipients (members). Groups support message history, member management, and ownership transfer. Group membership is required to send and receive messages.

---

## API Endpoints

### Get Groups

```
GET /api/groups
```

Returns a paginated list of groups the authenticated user is a member of.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Query Parameters:**

| Parameter | Type   | Default | Description                  |
|-----------|--------|---------|------------------------------|
| `limit`   | number | 20      | Results per page             |
| `offset`  | number | 0       | Number of results to skip    |

**Response (200):**

```json
{
  "groups": [
    {
      "id": "group-001",
      "name": "Project Team",
      "description": "Main project discussion",
      "avatar": "https://minio.example.com/groups/...",
      "ownerId": "user-001",
      "recipientCount": 8,
      "lastMessage": {
        "id": "msg-200",
        "content": "Meeting at 3pm",
        "senderId": "user-003",
        "createdAt": "2025-03-10T13:00:00Z"
      },
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 5,
  "hasMore": false
}
```

---

### Create Group

```
POST /api/groups
```

Creates a new group. The authenticated user becomes the owner and is automatically added as a member.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

| Field           | Type     | Required | Description                              |
|-----------------|----------|----------|------------------------------------------|
| `name`          | string   | Yes      | Group name (1-100 characters)            |
| `description`   | string   | No       | Group description (max 500 characters)   |
| `recipientIds`  | string[] | No       | Initial member user IDs                  |

**Response (201):**

```json
{
  "id": "group-002",
  "name": "Design Team",
  "description": "Design discussions and reviews",
  "avatar": null,
  "ownerId": "user-001",
  "recipients": [
    { "id": "user-001", "username": "alice", "role": "owner" },
    { "id": "user-004", "username": "carol", "role": "member" }
  ],
  "createdAt": "2025-03-10T14:00:00Z"
}
```

**Error Responses:**

- `400` — Missing or invalid name
- `404` — One or more recipient IDs not found

---

### Get Group Messages

```
GET /api/groups/:id/messages
```

Retrieves messages for a specific group, ordered by creation time (newest first).

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Query Parameters:**

| Parameter | Type   | Default | Description                        |
|-----------|--------|---------|------------------------------------|
| `limit`   | number | 50      | Messages per page                  |
| `before`  | string | -       | Cursor: message ID to paginate before |

**Response (200):**

```json
{
  "messages": [
    {
      "id": "msg-200",
      "content": "Meeting at 3pm",
      "senderId": "user-003",
      "groupId": "group-001",
      "editedAt": null,
      "reactions": [],
      "createdAt": "2025-03-10T13:00:00Z"
    }
  ],
  "hasMore": true
}
```

**Error Responses:**

- `403` — Not a member of this group
- `404` — Group not found

---

### Send Group Message

```
POST /api/groups/:id/messages
```

Sends a message to a group. The message is broadcast to all group members via WebSocket.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

| Field      | Type   | Required | Description                         |
|------------|--------|----------|-------------------------------------|
| `content`  | string | Yes      | Message text (max 4000 characters)  |

**Response (201):**

```json
{
  "id": "msg-201",
  "content": "Sounds good, see you there!",
  "senderId": "user-001",
  "groupId": "group-001",
  "editedAt": null,
  "reactions": [],
  "createdAt": "2025-03-10T13:05:00Z"
}
```

**Error Responses:**

- `403` — Not a member of this group
- `404` — Group not found

---

### Add Recipient

```
POST /api/groups/:id/recipients
```

Adds a new member to the group. Only the group owner can add members.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

| Field        | Type   | Required | Description                    |
|--------------|--------|----------|--------------------------------|
| `userId`     | string | Yes      | UUID of the user to add        |

**Response (200):**

```json
{
  "message": "Recipient added",
  "group": {
    "id": "group-001",
    "recipientCount": 9
  }
}
```

**Error Responses:**

- `403` — Not the group owner
- `404` — User or group not found
- `409` — User is already a member

---

### Remove Recipient

```
DELETE /api/groups/:id/recipients
```

Removes a member from the group. The owner can remove any member. A member can remove themselves (leave the group).

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

| Field    | Type   | Required | Description                       |
|----------|--------|----------|-----------------------------------|
| `userId` | string | Yes      | UUID of the user to remove        |

**Response (200):**

```json
{
  "message": "Recipient removed",
  "group": {
    "id": "group-001",
    "recipientCount": 8
  }
}
```

**Error Responses:**

- `403` — Not authorized (not owner and not removing self)
- `404` — User or group not found

---

### Transfer Ownership

```
PATCH /api/groups/:id/owner
```

Transfers group ownership to another member. Only the current owner can transfer ownership.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

| Field    | Type   | Required | Description                          |
|----------|--------|----------|--------------------------------------|
| `newOwnerId` | string | Yes  | UUID of the member to make owner     |

**Response (200):**

```json
{
  "message": "Ownership transferred",
  "group": {
    "id": "group-001",
    "ownerId": "user-004"
  }
}
```

**Error Responses:**

- `403` — Not the group owner
- `400` — Target user is not a member of the group

---

### Update Group Details

```
PATCH /api/groups/:id
```

Updates the group name, description, or avatar. Only the group owner can update details.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

| Field          | Type   | Required | Description                     |
|----------------|--------|----------|---------------------------------|
| `name`         | string | No       | New group name                  |
| `description`  | string | No       | New group description           |
| `avatar`       | string | No       | New avatar URL                  |

**Response (200):**

```json
{
  "id": "group-001",
  "name": "Updated Project Team",
  "description": "Updated description",
  "avatar": "https://minio.example.com/groups/new-avatar.png",
  "ownerId": "user-001",
  "updatedAt": "2025-03-10T15:00:00Z"
}
```

**Error Responses:**

- `403` — Not the group owner
- `404` — Group not found

---

## WebSocket Events

### Client-to-Server Events

| Event            | Payload                                   | Description                       |
|------------------|-------------------------------------------|-----------------------------------|
| `groupTypingStart`  | `{ groupId }`                          | User is typing in a group         |
| `groupTypingStop`   | `{ groupId }`                          | User stopped typing in a group    |

### Server-to-Client Events

| Event              | Payload                                              | Description                           |
|--------------------|------------------------------------------------------|---------------------------------------|
| `onGroupMessage`   | `{ id, content, senderId, groupId, ... }`            | New message in a group                |
| `onGroupCreate`    | `{ id, name, ownerId, recipients, ... }`             | You were added to a new group         |
| `onGroupUpdate`    | `{ id, name, description, avatar, ... }`             | Group details were updated            |
| `onGroupMemberAdd` | `{ groupId, userId, username }`                      | New member added to the group         |
| `onGroupMemberRemove` | `{ groupId, userId }`                             | Member removed from the group         |
| `onGroupOwnerTransfer` | `{ groupId, previousOwnerId, newOwnerId }`       | Group ownership was transferred       |

---

## User Guide

### Creating a Group

1. Click the **New Group** button in the sidebar.
2. Enter a group name and optional description.
3. Add members by searching and selecting users.
4. Click **Create Group**.

### Sending Group Messages

1. Select a group from the sidebar.
2. Type your message and press **Enter** to send.
3. All group members receive the message in real time.

### Managing Group Members (Owner Only)

1. Open the group info panel by clicking the group name.
2. To add a member: Click **Add Member**, search for a user, and confirm.
3. To remove a member: Click the **X** next to their name and confirm.

### Leaving a Group

1. Open the group info panel.
2. Click **Leave Group** at the bottom.
3. Confirm the action. You will no longer receive messages from this group.

### Transferring Ownership (Owner Only)

1. Open the group info panel.
2. Click **Transfer Ownership** next to the desired member.
3. Confirm the transfer. You will become a regular member.

---

## Configuration

### Environment Variables

| Variable              | Description                                  | Default |
|-----------------------|----------------------------------------------|---------|
| `GROUP_MAX_MEMBERS`   | Maximum number of members per group          | `256`   |
| `GROUP_NAME_MAX_LEN`  | Maximum group name length                    | `100`   |
| `GROUP_DESC_MAX_LEN`  | Maximum group description length             | `500`   |
