# AI Bot Messaging

## Overview

The AI assistant bot system integrates with Ollama, a local LLM inference engine, to provide conversational AI within the chat application. Bots have configurable personas, system prompts, and models. Responses stream token-by-token in real-time via WebSocket. Each bot maintains its own conversation history with full context management.

---

## API Endpoints

### List Available Bots

```
GET /api/bots
```

Returns all bots visible to the authenticated user.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200):**

```json
[
  {
    "id": "uuid-bot-1",
    "name": "ChatBot",
    "persona": "A helpful and friendly assistant",
    "model": "llama3.2",
    "systemPrompt": "You are a helpful chat assistant...",
    "createdAt": "2025-03-01T10:00:00Z"
  }
]
```

**Error Responses:**

- `401` — Not authenticated

---

### Create a Bot

```
POST /api/bots
```

Creates a new bot with a custom persona. Available to ADMIN users.

**Request Body:**

| Field           | Type   | Required | Description                        |
|-----------------|--------|----------|------------------------------------|
| `name`          | string | Yes      | Display name for the bot           |
| `persona`       | string | Yes      | Short description of the bot's personality |
| `model`         | string | Yes      | Ollama model to use (e.g., `llama3.2`) |
| `systemPrompt`  | string | No       | System prompt for the LLM          |

**Response (201):**

```json
{
  "id": "uuid-bot-2",
  "name": "Code Helper",
  "persona": "A programming assistant",
  "model": "codellama",
  "systemPrompt": "You are an expert programmer...",
  "createdAt": "2025-06-10T12:00:00Z"
}
```

**Error Responses:**

- `400` — Missing required fields or invalid model name
- `403` — Insufficient role (requires ADMIN)

---

### Get Bot Details

```
GET /api/bots/:id
```

Returns full details for a specific bot.

**Response (200):**

```json
{
  "id": "uuid-bot-1",
  "name": "ChatBot",
  "persona": "A helpful and friendly assistant",
  "model": "llama3.2",
  "systemPrompt": "You are a helpful chat assistant...",
  "createdAt": "2025-03-01T10:00:00Z"
}
```

**Error Responses:**

- `404` — Bot not found

---

### Delete a Bot

```
DELETE /api/bots/:id
```

Removes a bot and all its conversation history. ADMIN only.

**Response (200):**

```json
{
  "deleted": true
}
```

**Error Responses:**

- `403` — Insufficient role (requires ADMIN)
- `404` — Bot not found

---

### Send a Message to a Bot

```
POST /api/bots/:id/chat
```

Sends a message to a bot and starts a streaming response. If no `conversationId` is provided, a new conversation is created.

**Request Body:**

| Field            | Type   | Required | Description                        |
|------------------|--------|----------|------------------------------------|
| `content`        | string | Yes      | The user's message                 |
| `conversationId` | string | No       | Existing conversation ID to continue |

**Response (200):**

```json
{
  "messageId": "uuid-msg-1",
  "conversationId": "uuid-conv-1"
}
```

**Error Responses:**

- `400` — Empty message content
- `404` — Bot not found
- `503` — Ollama service unavailable

---

## WebSocket Events

### Streaming Response

When a bot generates a response, tokens stream in real-time. The client receives chunks as they are produced by the LLM:

```javascript
// Each token chunk as it's generated
socket.on('onAIStreamChunk', (data) => {
  // data: { conversationId: "uuid-conv-1", chunk: "Hello" }
});
```

### Stream Complete

Emitted when the full response has been generated:

```javascript
socket.on('onAIStreamEnd', (data) => {
  // data: {
  //   conversationId: "uuid-conv-1",
  //   messageId: "uuid-msg-2",
  //   fullContent: "Hello! How can I help you today?",
  //   tokenCount: 42
  // }
});
```

### Stream Error

If generation fails mid-stream:

```javascript
socket.on('onAIStreamError', (data) => {
  // data: { conversationId: "uuid-conv-1", error: "Model load failed" }
});
```

---

## Data Model

### Bot Entity

| Field          | Type   | Description                        |
|----------------|--------|------------------------------------|
| `id`           | UUID   | Unique bot identifier              |
| `name`         | string | Display name                       |
| `persona`      | string | Short personality description      |
| `model`        | string | Ollama model identifier            |
| `systemPrompt` | string | Full system prompt for the LLM     |
| `createdAt`    | Date   | Creation timestamp                 |

### Bot Conversation Entity

| Field          | Type   | Description                              |
|----------------|--------|------------------------------------------|
| `id`           | UUID   | Conversation identifier                  |
| `botId`        | UUID   | Associated bot                           |
| `userId`       | UUID   | User who owns this conversation          |
| `createdAt`    | Date   | When the conversation started            |

### AI Message Entity

| Field            | Type   | Description                              |
|------------------|--------|------------------------------------------|
| `id`             | UUID   | Message identifier                       |
| `conversationId` | UUID   | Bot conversation this message belongs to |
| `role`           | string | `user` or `assistant`                    |
| `content`        | string | Message text                             |
| `tokenCount`     | number | Number of tokens in the response         |
| `createdAt`      | Date   | Timestamp                                |

---

## User Guide

1. Bots appear in your conversation sidebar with a robot icon
2. Click a bot to start a new conversation, or continue an existing one
3. Type your message and press Enter — the bot responds in real-time
4. Bot responses stream character-by-character with a typing indicator
5. Conversation history is saved — return anytime to continue
6. Multiple bots can be available, each with different capabilities and personas
7. Bot conversations are private — only you can see your chat history

---

## Configuration

### Environment Variables

| Variable                | Description                           | Default                    |
|-------------------------|---------------------------------------|----------------------------|
| `OLLAMA_HOST`           | Ollama server URL                     | `http://ollama:11434`      |
| `OLLAMA_DEFAULT_MODEL`  | Default model for new bots            | `llama3.2`                 |
