# Admin Moderation Tools

## Overview

The admin system provides role-based access control (USER, MODERATOR, ADMIN) with full moderation capabilities including user management, message deletion, report review, and a comprehensive audit log. Every write operation is automatically recorded for accountability.

---

## Roles

| Role       | Capabilities                                                  |
|------------|---------------------------------------------------------------|
| `USER`     | Standard access, can submit reports against other users       |
| `MODERATOR`| All USER capabilities + delete any message, review reports    |
| `ADMIN`    | All MODERATOR capabilities + ban/unban users, change roles, view audit logs |

New users are assigned the `USER` role by default. Only existing ADMINs can promote other users.

---

## API Endpoints

### List Users

```
GET /api/admin/users
```

Returns a paginated list of all users. Available to ADMIN role only.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Query Parameters:**

| Parameter   | Type   | Description                     |
|-------------|--------|---------------------------------|
| `page`      | number | Page number (default: 1)        |
| `limit`     | number | Results per page (default: 20)  |
| `search`    | string | Filter by username or email     |

**Response (200):**

```json
{
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "USER",
      "banned": false,
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 142,
  "page": 1,
  "limit": 20
}
```

**Error Responses:**

- `401` — Not authenticated
- `403` — Insufficient role (requires ADMIN)

---

### Ban or Unban User

```
PATCH /api/admin/users/:id/ban
```

Toggles a user's banned status. Banned users cannot log in or access any API endpoints.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

| Field    | Type    | Required | Description                          |
|----------|---------|----------|--------------------------------------|
| `banned` | boolean | Yes      | `true` to ban, `false` to unban      |

**Response (200):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "johndoe",
  "banned": true
}
```

**Error Responses:**

- `403` — Insufficient role (requires ADMIN)
- `404` — User not found

---

### Change User Role

```
PATCH /api/admin/users/:id/role
```

Changes a user's role. Cannot change your own role.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

| Field   | Type   | Required | Description                              |
|---------|--------|----------|------------------------------------------|
| `role`  | string | Yes      | One of: `USER`, `MODERATOR`, `ADMIN`     |

**Response (200):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "johndoe",
  "role": "MODERATOR"
}
```

**Error Responses:**

- `400` — Invalid role value
- `403` — Insufficient role or attempting to change own role
- `404` — User not found

---

### Delete Message (Moderation)

```
DELETE /api/admin/messages/:id
```

Deletes any message across all conversations and groups. Available to MODERATOR and ADMIN roles.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200):**

```json
{
  "deleted": true,
  "messageId": 42
}
```

**Error Responses:**

- `403` — Insufficient role (requires MODERATOR or ADMIN)
- `404` — Message not found

---

### Submit a Report

```
POST /api/reports
```

Any authenticated user can submit a report against another user, optionally referencing a specific message.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

| Field            | Type   | Required | Description                        |
|------------------|--------|----------|------------------------------------|
| `reportedUserId` | string | Yes      | UUID of the user being reported    |
| `messageId`      | number | No       | ID of the offending message        |
| `reason`         | string | Yes      | Description of the violation       |

**Response (201):**

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "reportedUserId": "550e8400-e29b-41d4-a716-446655440000",
  "reporterId": "770e8400-e29b-41d4-a716-446655440002",
  "messageId": 42,
  "reason": "Harassment in group chat",
  "status": "pending",
  "createdAt": "2025-06-10T14:20:00Z"
}
```

**Error Responses:**

- `400` — Missing required fields
- `404` — Reported user or message not found

---

### List Reports

```
GET /api/admin/reports
```

Returns reports filtered by status. Available to MODERATOR and ADMIN roles.

**Query Parameters:**

| Parameter | Type   | Description                                    |
|-----------|--------|------------------------------------------------|
| `status`  | string | Filter: `pending`, `reviewed`, `resolved`, `dismissed` |
| `page`    | number | Page number (default: 1)                       |
| `limit`   | number | Results per page (default: 20)                 |

**Response (200):**

```json
{
  "reports": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "reportedUser": { "id": "...", "username": "baduser" },
      "reporter": { "id": "...", "username": "gooduser" },
      "reason": "Harassment",
      "status": "pending",
      "createdAt": "2025-06-10T14:20:00Z"
    }
  ],
  "total": 8
}
```

---

### Update Report Status

```
PATCH /api/admin/reports/:id
```

Updates a report's status after review.

**Request Body:**

| Field     | Type   | Required | Description                                      |
|-----------|--------|----------|--------------------------------------------------|
| `status`  | string | Yes      | One of: `reviewed`, `resolved`, `dismissed`       |

**Response (200):**

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "status": "resolved"
}
```

**Error Responses:**

- `400` — Invalid status value
- `403` — Insufficient role
- `404` — Report not found

---

### View Audit Logs

```
GET /api/admin/audit-logs
```

Returns a paginated, filterable list of audit log entries. Available to ADMIN role only.

**Query Parameters:**

| Parameter | Type   | Description                                    |
|-----------|--------|------------------------------------------------|
| `userId`  | string | Filter by the user who performed the action    |
| `action`  | string | Filter: `CREATE`, `UPDATE`, `DELETE`           |
| `entity`  | string | Filter by entity type (User, Message, Group)   |
| `from`    | string | Start date (ISO 8601)                          |
| `to`      | string | End date (ISO 8601)                            |
| `page`    | number | Page number (default: 1)                       |
| `limit`   | number | Results per page (default: 50)                 |

**Response (200):**

```json
{
  "logs": [
    {
      "id": "uuid",
      "userId": "550e8400-...",
      "user": { "username": "admin" },
      "action": "DELETE",
      "entity": "Message",
      "entityId": "42",
      "metadata": { "conversationId": 10, "reason": "violation" },
      "ipAddress": "192.168.1.100",
      "createdAt": "2025-06-10T15:00:00Z"
    }
  ],
  "total": 234
}
```

**Error Responses:**

- `403` — Insufficient role (requires ADMIN)

---

## Audit Log Schema

Every write operation (create, update, delete) is automatically logged by the audit processor running on the RabbitMQ queue. The log captures:

| Field       | Type   | Description                                      |
|-------------|--------|--------------------------------------------------|
| `userId`    | UUID   | Who performed the action                         |
| `action`    | string | `CREATE`, `UPDATE`, or `DELETE`                  |
| `entity`    | string | Entity type affected (User, Message, Group, etc.)|
| `entityId`  | string | UUID/ID of the affected entity                   |
| `metadata`  | JSONB  | Additional context (e.g., previous values)       |
| `ipAddress` | string | Request source IP                                |
| `createdAt` | Date   | Timestamp of the action                          |

---

## User Guide (Admin)

1. Access admin panel via the settings menu (gear icon → Admin)
2. **Users tab**: Search users by name or email, view activity status, ban/adjust roles
3. **Reports tab**: Review submitted reports, take action (resolve/dismiss), view related messages
4. **Audit tab**: View chronological log of all system actions with date/user/action filters
5. Reports with `pending` status are highlighted for immediate review
6. Banned users see an error on login attempt and cannot access the API

---

## Configuration

### Environment Variables

| Variable               | Description                          | Default      |
|------------------------|--------------------------------------|--------------|
| `RABBITMQ_HOST`        | RabbitMQ host for audit queue        | `localhost`  |
| `RABBITMQ_PORT`        | RabbitMQ port                        | `5672`       |
| `RABBITMQ_USER`        | RabbitMQ username                    | `chatapp`    |
| `RABBITMQ_PASSWORD`    | RabbitMQ password                    | `chatapp_secret` |
