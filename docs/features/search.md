# Search

## Overview

The search feature provides full-text search across messages, users, and groups. It is powered by PostgreSQL full-text search (tsvector/tsquery) with ranking and pagination support. Results are returned in relevance order.

---

## API Endpoints

### Search

```
GET /api/search
```

Performs a full-text search across the specified content type. Returns results ranked by relevance.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Query Parameters:**

| Parameter | Type   | Required | Default   | Description                                  |
|-----------|--------|----------|-----------|----------------------------------------------|
| `q`       | string | Yes      | -         | Search query (min 2 characters)              |
| `type`    | string | No       | `message` | Search scope: `message`, `user`, or `group`  |
| `limit`   | number | No       | `20`      | Results per page (max 100)                   |
| `offset`  | number | No       | `0`       | Number of results to skip                    |

**Response (200) — Message Search:**

```json
{
  "query": "meeting agenda",
  "type": "message",
  "results": [
    {
      "id": "msg-500",
      "content": "Here is the meeting agenda for tomorrow",
      "senderId": "user-003",
      "senderUsername": "carol",
      "conversationId": "conv-005",
      "groupId": null,
      "createdAt": "2025-03-08T09:00:00Z",
      "rank": 0.35
    }
  ],
  "total": 12,
  "hasMore": true
}
```

**Response (200) — User Search:**

```json
{
  "query": "alice",
  "type": "user",
  "results": [
    {
      "id": "user-001",
      "username": "alice",
      "avatar": "https://minio.example.com/avatars/alice.png",
      "status": "online",
      "isFriend": true,
      "rank": 1.0
    }
  ],
  "total": 1,
  "hasMore": false
}
```

**Response (200) — Group Search:**

```json
{
  "query": "project",
  "type": "group",
  "results": [
    {
      "id": "group-001",
      "name": "Project Team",
      "description": "Main project discussion",
      "avatar": "...",
      "memberCount": 8,
      "rank": 0.72
    }
  ],
  "total": 3,
  "hasMore": false
}
```

**Error Responses:**

- `400` — Query too short (under 2 characters) or invalid type

---

## Implementation Details

### PostgreSQL Full-Text Search

The search uses PostgreSQL's built-in full-text search capabilities:

- **tsvector**: Message content and group names/descriptions are indexed using `to_tsvector('english', content)`.
- **tsquery**: User queries are converted with `to_tsquery('english', query)` or `plainto_tsquery` for plain text input.
- **Ranking**: Results are ranked using `ts_rank` for relevance scoring.
- **GIN Index**: A GIN index is created on the tsvector columns for fast lookups.

### Example SQL (Message Search)

```sql
SELECT m.*, ts_rank(m.content_tsv, query) AS rank
FROM messages m, plainto_tsquery('english', $1) query
WHERE m.content_tsv @@ query
  AND (m.conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = $2)
       OR m.group_id IN (SELECT group_id FROM group_members WHERE user_id = $2))
ORDER BY rank DESC
LIMIT $3 OFFSET $4;
```

### Access Control

Search results are filtered based on the authenticated user's access:
- **Messages**: Only messages from conversations and groups the user is a member of.
- **Users**: All users are searchable, but friend status is included for context.
- **Groups**: Only groups the user is a member of are returned.

---

## WebSocket Events

Search does not use WebSocket events. It is entirely request/response based via the REST endpoint.

---

## User Guide

### Searching for Messages

1. Click the **Search** icon (magnifying glass) in the top navigation bar.
2. Type your search query (at least 2 characters).
3. Select the **Messages** tab in the search results.
4. Results are shown with the matching text highlighted and ranked by relevance.
5. Click a result to jump to the conversation and message.

### Searching for Users

1. Open the **Search** bar.
2. Type the username you are looking for.
3. Select the **People** tab.
4. Results show matching users with their avatar and online status.
5. Click a user to view their profile or start a conversation.

### Searching for Groups

1. Open the **Search** bar.
2. Type the group name.
3. Select the **Groups** tab.
4. Results show matching groups with member counts.
5. Click a group to open it.

### Pagination

Search results are paginated. Scroll to the bottom of the results list to load more. The search bar displays the total number of matching results.

---

## Configuration

### Environment Variables

| Variable                  | Description                                    | Default |
|---------------------------|------------------------------------------------|---------|
| `SEARCH_MIN_QUERY_LEN`    | Minimum characters for a search query          | `2`     |
| `SEARCH_MAX_RESULTS`      | Maximum results per request                    | `100`   |
| `SEARCH_DEFAULT_LIMIT`    | Default results per page                       | `20`    |
| `SEARCH_LANGUAGE`         | PostgreSQL text search configuration language  | `english` |
