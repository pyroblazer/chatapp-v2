# Settings & User Profile

## Overview

User settings include profile customization (avatar, banner, about text), appearance (dark/light theme), username management, and presence preferences. Profile images are stored in MinIO and served via presigned URLs. The profile system supports an onboarding flow for new users.

---

## API Endpoints

### Get Current User's Profile

```
GET /api/users/profiles
```

Returns the authenticated user's full profile including avatar and banner URLs.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200):**

```json
{
  "id": 1,
  "about": "Full-stack developer",
  "avatar": "https://minio:9000/chatapp-avatars/uuid-avatar.jpg",
  "banner": "https://minio:9000/chatapp-avatars/uuid-banner.jpg"
}
```

**Error Responses:**

- `401` — Not authenticated

---

### Update Profile

```
PATCH /api/users/profiles
```

Updates the authenticated user's profile. Supports partial updates — only included fields are changed.

**Headers:**

```
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

**Request Body (multipart):**

| Field    | Type   | Required | Description                       |
|----------|--------|----------|-----------------------------------|
| `about`  | string | No       | Bio/status text (max 200 chars)   |
| `avatar` | File   | No       | Profile image (JPG/PNG, max 5 MB) |
| `banner` | File   | No       | Banner image (recommended 1500x400px) |

**Response (200):**

```json
{
  "id": 1,
  "about": "Updated bio text",
  "avatar": "https://minio:9000/chatapp-avatars/new-uuid.jpg",
  "banner": "https://minio:9000/chatapp-avatars/uuid-banner.jpg"
}
```

**Error Responses:**

- `400` — Invalid file type or size exceeds limit
- `401` — Not authenticated
- `413` — File too large (max 5 MB for avatars, 10 MB for banners)

---

### Complete Profile (Onboarding)

```
POST /api/users/profiles/complete
```

Completes the new user onboarding flow by setting initial profile data. Called once after registration.

**Headers:**

```
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

**Request Body (multipart):**

| Field    | Type   | Required | Description                        |
|----------|--------|----------|------------------------------------|
| `about`  | string | Yes      | Initial bio/status text            |
| `avatar` | File   | No       | Profile image                      |
| `banner` | File   | No       | Banner image                       |

**Response (200):**

```json
{
  "id": 1,
  "about": "Hello, I'm new here!",
  "avatar": "https://minio:9000/chatapp-avatars/uuid.jpg",
  "banner": null
}
```

**Error Responses:**

- `400` — Missing required `about` field
- `401` — Not authenticated

---

### Check Username Availability

```
GET /api/exists/username?username=:name
```

Checks whether a username is available for registration or profile change. Used during registration and the onboarding flow.

**Query Parameters:**

| Parameter  | Type   | Required | Description            |
|------------|--------|----------|------------------------|
| `username` | string | Yes      | Username to check      |

**Response (200):**

```json
{
  "exists": false
}
```

**Error Responses:**

- `400` — Missing username parameter

---

### Check if Conversation Exists

```
GET /api/exists/conversations/:recipientId
```

Checks if a conversation already exists with a specific user. If it does, returns the conversation. If not, creates one.

**Response (200):**

```json
{
  "id": 42,
  "creator": { "id": "...", "username": "alice" },
  "recipient": { "id": "...", "username": "bob" },
  "createdAt": "2025-06-10T14:00:00Z"
}
```

**Error Responses:**

- `401` — Not authenticated
- `404` — Recipient user not found

---

### Update Appearance

```
PATCH /api/users/settings
```

Updates user appearance preferences. Currently supports theme selection.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

| Field   | Type   | Required | Description                    |
|---------|--------|----------|--------------------------------|
| `theme` | string | No       | One of: `dark`, `light`        |

**Response (200):**

```json
{
  "theme": "dark"
}
```

**Error Responses:**

- `400` — Invalid theme value
- `401` — Not authenticated

---

### Update Presence Status

```
PATCH /api/users/presence/status
```

See [Presence](presence.md) for full details on presence settings.

---

## User Guide

### Changing Your Avatar

1. Click your avatar in the bottom-left sidebar
2. Select **Edit Profile**
3. Click the camera icon on your current avatar
4. Choose a new image (JPG or PNG, max 5 MB)
5. Click **Save** — your avatar updates immediately for all users

### Changing Your Banner

1. Go to Settings → Profile
2. Click **Change Banner**
3. Upload an image (recommended: 1500x400px, max 10 MB)
4. Click **Save**

### Switching Theme

1. Go to Settings → Appearance
2. Toggle between **Dark** and **Light**
3. The theme applies instantly and persists across sessions

### Updating Your About Section

1. Go to Settings → Profile
2. Click the **About** text area
3. Type your status or bio (max 200 characters)
4. Click **Save**

### Completing Onboarding

1. After registering, you are prompted to complete your profile
2. Add an about message (required) and optionally upload an avatar and banner
3. Click **Continue** to enter the main chat interface

---

## Configuration

### Environment Variables

| Variable                | Description                          | Default              |
|-------------------------|--------------------------------------|----------------------|
| `MINIO_ENDPOINT`        | MinIO server for avatar/banner storage| `localhost`         |
| `MINIO_PORT`            | MinIO port                           | `9000`               |
| `MINIO_ACCESS_KEY`      | MinIO access key                     | `minioadmin`         |
| `MINIO_SECRET_KEY`      | MinIO secret key                     | `minioadmin`         |
| `S3_BUCKET`             | Default storage bucket               | `chatapp-uploads`    |
