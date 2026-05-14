# Architecture Decisions & Technology Choices

> A comprehensive engineering decision document explaining why every major technology and architecture decision was chosen for the ChatApp real-time messaging platform. Written as Architecture Decision Records (ADRs) following Principal Engineer design reasoning.

---

## 1. Architectural Philosophy

### 1.1 Why This Architecture Exists

ChatApp is designed as a production-grade real-time messaging platform that prioritizes:

1. **Developer velocity** — A single developer or small team can understand, modify, and deploy the entire system
2. **Operational simplicity** — The full stack runs via `docker compose up` with no external service dependencies for local development
3. **Real-time by default** — WebSocket events are first-class citizens, not bolted onto a REST API
4. **Privacy-first AI** — Local LLM inference keeps user data within the deployment boundary
5. **Incremental complexity** — Start as a modular monolith, extract microservices only when scale demands it

### 1.2 System Goals

| Goal | Priority | Approach |
|------|----------|----------|
| Reliability | High | Health checks for all services, dead-letter queues with retry, PostgreSQL ACID guarantees |
| Scalability | Medium | Redis adapter for horizontal WebSocket scaling, stateless backend, RabbitMQ for async decoupling |
| Extensibility | High | Modular NestJS architecture, enum-based DI tokens, event-driven communication between modules |
| Operability | High | Docker Compose single-command deployment, Prometheus + Grafana monitoring, structured health endpoint |
| Security | High | JWT dual-token auth, bcrypt password hashing, rate limiting, audit logging, RBAC |

### 1.3 Core Tradeoffs

**Simplicity vs. Scalability**

We chose simplicity. A modular monolith with Docker Compose is easier to develop, test, and deploy than a distributed microservices architecture. The Redis adapter for Socket.IO provides a horizontal scaling escape hatch when needed. We accept that at very large scale (millions of concurrent users), the monolith will need decomposition — but we optimize for the 99% case where it won't.

**Consistency vs. Availability**

We chose consistency. PostgreSQL's ACID guarantees are essential for a messaging system where message ordering, delivery confirmation, and conversation integrity must be reliable. We accept that this means the system cannot be globally distributed with multi-region writes in the current architecture. For single-region deployments, this is the correct tradeoff.

**Performance vs. Maintainability**

We chose maintainability. The two-layer event system (EventEmitter2 → WebSocket Gateway) adds a layer of indirection that could be eliminated by having controllers emit WebSocket events directly. However, this decoupling means business logic controllers don't need to know about WebSocket connections, making the system far easier to test and modify. The performance cost is negligible (in-process event emission adds microseconds).

---

