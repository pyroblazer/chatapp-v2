# File Uploads & Storage

## Overview

File and image attachments are stored in MinIO (S3-compatible object storage) and accessed via presigned URLs for security. The system supports images, documents, videos, and audio files up to 10 MB. Thumbnails are auto-generated for images using Sharp. Three MinIO buckets are created on startup: `chatapp-uploads`, `chatapp-avatars`, and `chatapp-attachments`.

---

## API Endpoints

### Request Presigned Upload URL

```
POST /api/storage/presign
```

Generates a presigned URL that the client uses to upload directly to MinIO, bypassing the backend for the file transfer.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

| Field         | Type   | Required | Description                       |
|---------------|--------|----------|-----------------------------------|
| `filename`    | string | Yes      | Original filename                 |
| `contentType` | string | Yes      | MIME type of the file             |

**Response (200):**

```json
{
  "uploadUrl": "https://minio:9000/chatapp-uploads/uuid-filename.jpg?X-Amz-...",
  "key": "uuid-filename.jpg",
  "fileUrl": "/api/storage/file/uuid-filename.jpg"
}
```

**Error Responses:**

- `400` — Missing filename or contentType
- `401` — Not authenticated

---

### Upload File to MinIO

```
PUT {uploadUrl}
```

Upload the file binary directly to the presigned URL returned above. This request goes to MinIO, not the backend API.

**Headers:**

```
Content-Type: {contentType}
```

**Request Body:** Raw file binary

The presigned URL expires after a configurable period. Uploads exceeding 10 MB are rejected.

---

### Get File via Presigned URL

```
GET /api/storage/file/:key
```

Returns a fresh presigned download URL for the stored file. The URL expires after 1 hour by default.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (302):** Redirects to the MinIO presigned URL.

**Error Responses:**

- `401` — Not authenticated
- `404` — File key not found

---

### Check File Existence

```
GET /api/storage/exists/:key
```

Checks whether a file exists in the storage bucket without downloading it.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200):**

```json
{
  "exists": true
}
```

---

### Upload with Thumbnail (Server-Side)

```
POST /api/storage/upload
```

Uploads a file through the backend and auto-generates a 300px JPEG thumbnail for images. Returns both the original key and the thumbnail key.

**Headers:**

```
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

**Request Body (multipart):**

| Field  | Type | Required | Description      |
|--------|------|----------|------------------|
| `file` | File | Yes      | File to upload   |

**Response (200):**

```json
{
  "key": "uuid-photo.jpg",
  "thumbnailKey": "uuid-photo-thumb.jpg",
  "size": 204800,
  "contentType": "image/jpeg"
}
```

**Error Responses:**

- `400` — No file provided or file too large (max 10 MB)
- `415` — Unsupported MIME type

---

### Attach File to Message

```
POST /api/conversations/:id/messages
Content-Type: multipart/form-data
```

Sends a message with file attachments. Attachments are processed asynchronously via the file-upload queue processor.

**Request Body (multipart):**

| Field          | Type   | Required | Description                  |
|----------------|--------|----------|------------------------------|
| `content`      | string | No       | Message text                 |
| `attachments`  | File[] | No       | One or more files to attach  |

**Error Responses:**

- `400` — Invalid conversation ID or empty message with no attachments
- `401` — Not authenticated
- `403` — Not a participant in this conversation

---

### Delete File

```
DELETE /api/storage/file/:key
```

Removes a file from MinIO storage.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200):**

```json
{
  "deleted": true
}
```

**Error Responses:**

- `401` — Not authenticated
- `404` — File not found

---

## Supported File Types

| Category | MIME Types                                       |
|----------|--------------------------------------------------|
| Images   | `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml` |
| Documents| `application/pdf`, `text/plain`, `application/json` |
| Video    | `video/mp4`                                      |
| Audio    | `audio/mpeg`, `audio/ogg`, `audio/webm`          |
| Other    | `application/octet-stream`                       |

**Maximum file size:** 10 MB

---

## WebSocket Events

### Attachment Processed

When a message with attachments is created, the attachments are processed asynchronously (thumbnail generation, metadata extraction). The client receives an update when processing completes:

```javascript
socket.on('onAttachmentProcessed', (data) => {
  // data: { messageId, attachments: [{ key, thumbnailKey, contentType, size }] }
});
```

---

## Storage Architecture

```
Client                Backend API                 MinIO
  |                       |                         |
  |-- POST /presign ----->|                         |
  |<-- { uploadUrl } -----|                         |
  |                                                  |
  |-- PUT {uploadUrl} ----------------------------->|
  |<-- 200 OK --------------------------------------|
  |                                                  |
  |-- POST /messages (with key) -->|                |
  |                       |-- async thumbnail ------>|
  |<-- onAttachmentProcessed ----  |                |
```

---

## User Guide

1. In any conversation, click the attachment icon (paperclip) in the message input
2. Select a file from your device (max 10 MB)
3. The file uploads automatically and appears as an attachment in your message
4. Click any attachment to view/download it full-size
5. Image attachments show a thumbnail preview inline
6. Supported formats: images, PDFs, text files, video (MP4), and audio files

---

## Configuration

### Environment Variables

| Variable                | Description                          | Default              |
|-------------------------|--------------------------------------|----------------------|
| `MINIO_ENDPOINT`        | MinIO server hostname                | `localhost`          |
| `MINIO_PORT`            | MinIO server port                    | `9000`               |
| `MINIO_ACCESS_KEY`      | Access key (or `MINIO_ROOT_USER`)   | `minioadmin`         |
| `MINIO_SECRET_KEY`      | Secret key (or `MINIO_ROOT_PASSWORD`)| `minioadmin`        |
| `MINIO_USE_SSL`         | Enable SSL for MinIO connection      | `false`              |
| `S3_BUCKET`             | Default bucket for file uploads      | `chatapp-uploads`    |

### MinIO Buckets

| Bucket                  | Purpose                              |
|-------------------------|--------------------------------------|
| `chatapp-uploads`       | General file attachments             |
| `chatapp-avatars`       | User profile avatars                 |
| `chatapp-attachments`   | Message-specific attachments         |

All buckets are created automatically on first startup with anonymous read access enabled.
