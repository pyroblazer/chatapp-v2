You are a Staff+ Principal Software Architect and Senior Fullstack Engineer.

Your task is to design and fix the current implementation and turn it into a COMPLETE production-grade specification, architecture, implementation plan, engineering reasoning, and repository structure for a scalable real-time Chat Application using:

- Backend: NestJS (TypeScript)
- Frontend: React + Vite + TypeScript
- Database: PostgreSQL
- Cache / realtime infra: Redis
- Queue: BullMQ or RabbitMQ
- Object storage: MinIO or S3-compatible storage
- Containerization: Docker + Docker Compose
- Reverse Proxy: NGINX
- Monitoring & Observability: Prometheus + Grafana + Loki + OpenTelemetry
- Authentication: JWT + Refresh Token + optional OAuth
- AI Bot Messaging: free/open-source LLM integration
- CI/CD ready architecture
- Enterprise-grade compliance considerations

IMPORTANT:
Do NOT create a toy project.
Think like you are designing a production-grade enterprise messaging platform similar to:
- WhatsApp
- Discord
- Slack
- Telegram
- Microsoft Teams

The output must be EXTREMELY DETAILED and ENGINEERING-LEVEL. The setup should be runnable easily through docker-compose. React should be deployable to vercel. Backend should also be easily deployable.

==================================================
SECTION 1 — PRODUCT REQUIREMENTS
==================================================

First, clarify and define:
- Functional requirements
- Non-functional requirements
- Scalability goals
- Security goals
- Compliance goals
- Reliability goals
- Observability goals
- UX goals
- Accessibility goals
- Mobile responsiveness considerations
- Future extensibility

Include:
- Multi-user chats
- Direct messaging
- Group chats
- Presence (online/offline)
- Typing indicators
- Message delivery status
- Read receipts
- Reactions / emoji support
- File/image attachment
- Message reply/threading
- Search
- Notifications
- AI assistant bot
- Admin moderation tools
- Audit logs
- Rate limiting
- Spam prevention
- Retry handling
- Offline synchronization

==================================================
SECTION 2 — SYSTEM DESIGN
==================================================

Create an EXTREMELY DETAILED architecture explanation.

Explain:
- Monolith vs modular monolith vs microservices tradeoffs
- Why NestJS is chosen
- Why React is chosen
- Why PostgreSQL
- Why Redis
- Why message queues
- Why object storage
- CAP theorem tradeoffs
- Horizontal scaling strategy
- Event-driven architecture
- CQRS considerations
- WebSocket scaling
- Pub/Sub architecture
- Session consistency
- Stateless API design
- Multi-instance deployment
- Failover strategy
- Disaster recovery
- Data retention
- Backup strategy
- Message durability strategy
- Distributed locking
- Idempotency strategy
- Race condition prevention
- Event ordering strategy
- Message sequencing
- Exactly-once vs at-least-once delivery
- Retry strategy
- Dead letter queue strategy
- Reconnection handling
- WebSocket reconnect logic
- Sticky sessions tradeoffs
- Redis adapter usage
- Queue worker scaling
- Backpressure handling

Include:
- Detailed diagrams in Mermaid
- Data flow diagrams
- Sequence diagrams
- Component diagrams
- Deployment diagrams
- Queue processing diagrams

==================================================
SECTION 3 — DATABASE DESIGN
==================================================

Create COMPLETE production-grade PostgreSQL schema design.

Include:
- Users
- Sessions
- Refresh tokens
- Chats
- Chat members
- Messages
- Message attachments
- Message reactions
- Read receipts
- Message delivery tracking
- Typing events
- Notifications
- Audit logs
- Bot conversations
- AI prompts/responses
- API keys
- Feature flags
- Soft deletes
- GDPR deletion tracking
- Moderation actions
- Device sessions
- Rate limiting tables
- Idempotency keys

Requirements:
- UUID usage
- Partitioning strategy
- Indexing strategy
- Composite indexes
- Full-text search
- JSONB usage
- Row-level security considerations
- Multi-tenant considerations
- Optimistic locking
- Timestamp strategy
- Created/updated/deleted timestamps
- Soft delete design
- Audit history design

Explain:
- Why each table exists
- Why normalization or denormalization is chosen
- Tradeoffs
- Performance implications

Generate:
- ERD diagrams
- Full SQL DDL
- Prisma schema
- TypeORM alternative

==================================================
SECTION 4 — REALTIME ARCHITECTURE
==================================================

Design:
- WebSocket gateway architecture
- Socket.IO vs native WebSocket tradeoffs
- Scaling across pods/containers
- Redis Pub/Sub adapter
- Message fanout strategy
- Presence tracking
- Typing indicators
- Reconnection recovery
- Message ordering
- Duplicate prevention
- Ack handling
- Retry acknowledgement flow

Explain:
- How race conditions happen
- How to prevent duplicated messages
- How to ensure idempotent message sending
- How to prevent stale websocket state
- How to avoid ghost online users

==================================================
SECTION 5 — MESSAGE QUEUE ARCHITECTURE
==================================================

Design queue-based async processing for:
- Notifications
- Image processing
- Thumbnail generation
- AI bot processing
- Message retries
- Delivery retries
- Email sending
- Audit event processing
- Analytics events
- Moderation scanning

Compare:
- BullMQ
- RabbitMQ
- Kafka

Explain:
- Why to choose one
- Retry policies
- Exponential backoff
- Dead letter queues
- Poison message handling
- Queue observability

==================================================
SECTION 6 — SECURITY & COMPLIANCE
==================================================

Design enterprise-grade security.

Include:
- OWASP Top 10 mitigation
- JWT best practices
- Refresh token rotation
- CSRF/XSS/CORS protection
- Input validation
- Rate limiting
- RBAC
- API gateway protection
- SQL injection prevention
- Secrets management
- Encryption at rest
- Encryption in transit
- Password hashing
- Secure websocket authentication
- Device fingerprinting
- Suspicious activity detection
- Brute force prevention
- Abuse prevention

Compliance requirements:
- GDPR
- ISO27001
- ISO9001
- Audit logging
- Right to be forgotten
- Data retention policies
- Consent management
- PII masking
- Data export requests

Explain:
- Tradeoffs
- Implementation details
- Governance considerations

==================================================
SECTION 7 — FILE & IMAGE ATTACHMENTS
==================================================

Design scalable media handling.

Include:
- Image uploads
- Video uploads
- Attachment metadata
- Presigned URLs
- CDN strategy
- Compression
- Virus scanning
- MIME validation
- Async image processing
- Chunk uploads
- Upload retry handling
- Deduplication strategy
- Thumbnail generation
- Secure access control

Explain:
- S3 vs MinIO
- Storage lifecycle policy
- Cost optimization

==================================================
SECTION 8 — AI BOT MESSAGING
==================================================

Design integrated AI chatbot support using FREE or OPEN-SOURCE LLMs.

Requirements:
- Local LLM support
- Ollama integration
- Llama.cpp support
- OpenRouter optional support
- Bot persona system
- Chat memory
- Prompt management
- Context window optimization
- Token budgeting
- AI moderation
- Streaming responses
- Retry handling
- Queue-based AI processing

Explain:
- Cost tradeoffs
- Latency tradeoffs
- Privacy implications
- Local inference vs hosted inference

Generate:
- Example bot architecture
- Prompt templates
- Context retrieval strategy
- Vector search optional architecture

==================================================
SECTION 9 — FRONTEND ARCHITECTURE
==================================================

Design scalable React frontend architecture.

Include:
- Folder structure
- Feature-based architecture
- State management
- React Query usage
- WebSocket state sync
- Optimistic updates
- Infinite scrolling
- Virtualized message list
- Offline mode
- Retry UI
- Error boundaries
- Accessibility
- Internationalization
- Theming
- Dark mode
- Mobile responsiveness

Explain:
- Redux vs Zustand vs Context API
- Why chosen approach is best

==================================================
SECTION 10 — BACKEND ARCHITECTURE
==================================================

Design enterprise NestJS architecture.

Include:
- Module structure
- Domain-driven design
- CQRS optional design
- Shared kernel
- Guards
- Interceptors
- Filters
- Middleware
- Event emitters
- Repositories
- Services
- DTOs
- Validation
- Mapper patterns
- OpenAPI/Swagger
- API versioning
- Health checks
- Graceful shutdown

Generate:
- Folder structure
- Example modules
- Example DTOs
- Example entities
- Example websocket gateway
- Example queue workers

==================================================
SECTION 11 — OBSERVABILITY & OPERATIONS
==================================================

Design complete production observability.

Include:
- Structured logging
- Correlation IDs
- Distributed tracing
- Metrics
- Alerting
- Error tracking
- Audit logging
- Log aggregation
- Performance monitoring
- SLO/SLA definitions
- Health checks
- Synthetic monitoring

Use:
- Loki
- Prometheus
- Grafana
- OpenTelemetry

Explain:
- Log schema
- Retention strategy
- Sampling strategy
- PII masking in logs

==================================================
SECTION 12 — DEVOPS & INFRASTRUCTURE
==================================================

Design full Docker-based infrastructure.

Generate:
- Docker Compose
- Multi-stage Dockerfiles
- Production Dockerfiles
- NGINX config
- Reverse proxy config
- TLS setup
- Horizontal scaling strategy
- Kubernetes migration path
- CI/CD pipeline
- GitHub Actions
- Secrets handling
- Environment strategy
- Blue/green deployment
- Rolling deployment
- Zero-downtime deployment

Explain:
- Local development workflow
- Staging strategy
- Production deployment strategy

==================================================
SECTION 13 — TESTING STRATEGY
==================================================

Design full testing architecture.

Include:
- Unit tests
- Integration tests
- E2E tests
- Contract tests
- Load testing
- WebSocket testing
- Queue testing
- Chaos testing
- Security testing
- Performance testing

Explain:
- Testing pyramid
- Mocking strategy
- Fixture strategy

Generate example tests.

==================================================
SECTION 14 — PERFORMANCE ENGINEERING
==================================================

Design high-performance optimizations.

Explain:
- Redis caching strategy
- Query optimization
- Pagination strategy
- Cursor pagination
- Batch processing
- N+1 prevention
- Lazy loading
- Virtualization
- WebSocket optimization
- Compression
- CDN optimization
- Payload optimization
- Memory optimization

Include:
- Expected bottlenecks
- Profiling strategy
- Capacity planning

==================================================
SECTION 15 — README GENERATION
==================================================

Generate a COMPLETE professional README.md including:
- Project overview
- Features
- Architecture summary
- Stack overview
- Setup instructions
- Docker setup
- Environment variables
- Running locally
- Running production
- Testing
- CI/CD
- Monitoring
- Troubleshooting
- Tradeoff explanations
- Scalability notes
- Security notes
- Compliance notes
- Future improvements

The README should look like a REAL enterprise-grade open-source repository.

==================================================
IMPORTANT OUTPUT REQUIREMENTS
==================================================

The answer MUST:
- Be EXTREMELY detailed
- Be production-grade
- Explain WHY decisions are made
- Include tradeoffs
- Include best practices
- Include anti-pattern warnings
- Include performance considerations
- Include scalability considerations
- Include security considerations
- Include operational considerations
- Include compliance considerations
- Include extensibility implementations

The answer should resemble:
- A Staff Engineer architecture proposal
- A Senior Principal Engineer system design document
- A real enterprise technical specification

DO NOT:
- Give shallow explanations
- Skip tradeoffs
- Give toy examples
- Ignore operational complexity
- Ignore failure scenarios
- Ignore retries/race conditions
- Ignore observability
- Ignore compliance
- Ignore security

Think deeply before generating each section.