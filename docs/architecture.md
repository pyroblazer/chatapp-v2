# Architecture Overview

## System Design

ChatApp is a monorepo with Docker Compose orchestration, built around a decoupled event-driven architecture. The backend is a NestJS application with modular service design, using PostgreSQL for persistence, Redis for caching and real-time pub/sub, RabbitMQ for async processing, and MinIO for object storage.

### Service Map

```
                    ┌──────────┐
                    │  Nginx   │ :80 (reverse proxy)
                    └────┬─────┘
                         │
              ┌──────────┼──────────┐
              ▼                     ▼
        ┌──────────┐         ┌──────────┐
        │ Backend  │ :3001   │ Frontend │ :80 (nginx SPA) / :3000 (Vite dev)
        │ (NestJS) │         │ (React)  │
        └──┬───┬───┘         └──────────┘
           │   │
     ┌─────┘   └──────┐
     ▼         ▼      ▼
┌────────┐ ┌───────┐ ┌────────┐
│Postgres│ │ Redis │ │RabbitMQ│
│  :5432 │ │ :6379 │ │  :5672 │
└────────┘ └───────┘ └────────┘
     ▲                              ┌────────┐
     │                              │ MinIO  │ :9000
     └──────────────────────────────└────────┘
                                    ┌────────┐
                                    │ Ollama │ :11434
                                    └────────┘
```

---

## Two-Layer Event System

Real-time updates flow through a two-layer event architecture:

```
Controller Action
      │
      ▼
EventEmitter2 (in-process)
      │  @OnEvent('serverEvent')
      ▼
MessagingGateway (gateway.ts)
      │  socket.emit('websocketEvent')
      ▼
Connected Clients via Socket.IO
```

1. **Layer 1 — NestJS EventEmitter2**: Controllers emit domain events (e.g., `ServerEvents.MESSAGE_CREATE`) after performing write operations. This decouples business logic from real-time broadcasting.

2. **Layer 2 — MessagingGateway**: The gateway listens for server events via `@OnEvent` decorators and pushes WebSocket events to connected clients. It manages socket sessions, rooms, and broadcasting.

### Event Constants

Server-side events and WebSocket events are defined as enums in `src/utils/constants.ts`:

- `ServerEvents` — Internal events emitted by controllers (e.g., `MESSAGE_CREATE`, `FRIEND_REQUEST_RECEIVED`)
- `WebsocketEvents` — Events pushed to clients (e.g., `onMessage`, `onFriendRequestReceived`)

---

## WebSocket Gateway

The `MessagingGateway` (`src/gateway/gateway.ts`) is the central WebSocket handler:

- **Connection/Disconnection**: Authenticates via JWT in the socket handshake, initializes user session, updates presence
- **Room Management**: Joins sockets to conversation/group rooms for targeted broadcasting
- **Message Handling**: Listens for `@SubscribeMessage` events (e.g., `getOnlineFriends`, `getConversationMessages`)
- **Call Signaling**: Relays WebRTC offer/answer/ICE candidates for voice and video calls

### Session Manager

`GatewaySessionManager` (`src/gateway/gateway.session.ts`) tracks active WebSocket connections:

- Maps user IDs to their active socket connections
- Supports multiple tabs/devices per user
- Provides `getSockets(userId)`, `get(userId)`, `getEveryone()` for targeted and broadcast messaging

### Redis Adapter

`WebsocketAdapter` (`src/gateway/gateway.adapter.ts`) configures `@socket.io/redis-adapter` for multi-instance scaling:

- Pub/sub channels for broadcasting events across server instances
- Falls back to in-memory adapter if Redis is unavailable
- Required for horizontal scaling (multiple backend containers)

---

## Redis

Redis serves three purposes in the system:

### 1. Caching

`RedisCacheService` (`src/redis/redis.cache.service.ts`) provides a generic caching layer:

- Default TTL: 5 minutes
- Cached data: user profiles, conversation lists, friend lists
- Pattern-based cache invalidation on write operations
- Methods: `get`, `set`, `del`, `invalidatePattern`

### 2. Token Blacklisting

`RedisService` (`src/redis/redis.service.ts`) stores invalidated JWT tokens:

- Tokens are blacklisted on logout with TTL matching the token's remaining lifetime
- The auth guard checks the blacklist before accepting a token

### 3. WebSocket Pub/Sub

Used by the Socket.IO Redis adapter to synchronize events across multiple backend instances.

---

## RabbitMQ Message Queue

`RabbitMQService` (`src/rabbitmq/rabbitmq.service.ts`) manages the message queue infrastructure:

### Queue Architecture

- Each queue has a **dead letter exchange (DLX)** and corresponding `.dlq` dead letter queue
- Messages are retried up to **3 times** before being routed to the DLQ
- **Exponential backoff** on reconnection (up to 10 retries, max 30s delay)
- **Prefetch**: 10 messages per consumer

### Queue Processors

| Processor                  | Queue                | Description                           |
|----------------------------|----------------------|---------------------------------------|
| `FileUploadProcessor`      | `file-upload`        | Processes uploaded files: thumbnail generation, metadata extraction |
| `NotificationProcessor`    | `notification`       | Sends notifications: push, email, in-app |
| `AuditProcessor`           | `audit`              | Records audit log entries for all write operations |

---

## Health Checks

The health endpoint provides service availability monitoring:

```
GET /api/health
```

**Response (200):**

```json
{
  "status": "ok",
  "services": {
    "postgresql": "up",
    "redis": "up"
  },
  "timestamp": "2025-06-10T14:30:00.000Z"
}
```

- `status` is `"ok"` when all checked services are up, `"degraded"` when any is down
- PostgreSQL: verifies `connection.isConnected` and runs `SELECT 1`
- Redis: calls `redisService.ping()` and checks for `PONG`

**Docker healthcheck**: The backend container uses `wget` to probe this endpoint every 15 seconds. Other services (postgres, redis, rabbitmq, minio) have their own native healthchecks.

---

## Telemetry & Observability

The telemetry module (`src/telemetry/`) provides Prometheus-compatible metrics:

### Metrics Endpoint

```
GET /api/metrics
```

Exposes Prometheus-format metrics scraped by Prometheus every 15 seconds.

### Collected Metrics

| Metric                              | Type      | Labels                                    |
|-------------------------------------|-----------|-------------------------------------------|
| `http_requests_total`               | Counter   | `method`, `route`, `status_code`          |
| `http_request_duration_seconds`     | Histogram | `method`, `route`, `status_code`          |

### Collection Method

`TelemetryInterceptor` is a global NestJS interceptor that:

1. Records the start time of each request
2. Observes the response and records duration
3. Increments the request counter with appropriate labels

### Monitoring Stack

| Service     | Port  | Purpose                          |
|-------------|-------|----------------------------------|
| Prometheus  | 9090  | Metrics scraping and storage     |
| Grafana     | 3002  | Dashboards and alerting          |
| Loki        | 3100  | Log aggregation                  |
| Promtail    | —     | Log shipping to Loki             |

A pre-built Grafana dashboard (`docker/grafana/provisioning/dashboards/json/chatapp-overview.json`) is loaded automatically with CPU, memory, request rate, and latency panels.

---

## Module Architecture

All backend modules follow a consistent pattern:

1. **Interface file** (`<module>.ts`) — Defines service interface and DI token type
2. **Service class** (`<module>.service.ts`) — Implements business logic
3. **Module registration** — Service registered with `Services` enum token in the module
4. **Controller** (`<module>.controller.ts`) — REST endpoints with `Routes` prefix
5. **Tests** (`tests/*.spec.ts`) — Jest unit tests

### Dependency Injection

Services use string tokens from the `Services` enum rather than class-based tokens:

```typescript
// In the module
providers: [
  { provide: Services.CONVERSATIONS, useClass: ConversationsService },
]

// In a consumer
constructor(
  @Inject(Services.CONVERSATIONS)
  private readonly conversationService: IConversationsService,
) {}
```

---

## Database

- **PostgreSQL 16** via TypeORM 0.3.x
- All entities use UUID primary keys
- `BaseMessage` is an abstract class shared by `Message` and `GroupMessage`
- `synchronize: true` in development (auto-creates schema)
- Migrations required for production schema changes
- Entity relationships are eagerly loaded where needed to prevent N+1 queries
