# How to Run ChatApp

## Prerequisites

- **Docker** + **Docker Compose** (recommended)
- **Node.js 18+** and **Yarn** (for local dev without Docker)

---

## Option 1: Docker (Recommended)

This starts every service — PostgreSQL, Redis, MinIO, RabbitMQ, Ollama, backend, frontend, and NGINX — in one command.

### 1. Start all services

```bash
docker compose up
```

Add `-d` to run in the background:

```bash
docker compose up -d
```

### 2. Wait for healthy services

The backend waits for PostgreSQL, Redis, RabbitMQ, and MinIO to pass health checks before starting. This takes ~15-30 seconds on first run. Watch progress with:

```bash
docker compose logs -f backend
```

You should see `Running on Port 3001` when ready.

### 3. Seed the database (first run only)

The superuser account is created automatically if the backend Dockerfile runs the seed. If it doesn't, run manually:

```bash
docker compose exec backend yarn seed
```

### 4. Access the app

| Service | URL |
|---|---|
| **Frontend (via NGINX)** | http://localhost |
| **Backend API** | http://localhost/api |
| **Swagger Docs** | http://localhost/api/docs |
| **MinIO Console** | http://localhost:9001 |
| **RabbitMQ Management** | http://localhost:15672 |
| **Health Check** | http://localhost/api/health |

### 5. Log in

Use the default superuser account:

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `changeme123!` |

**Change these defaults** by editing `.env.docker` before starting:

```
SUPERUSER_USERNAME=admin
SUPERUSER_PASSWORD=changeme123!
SUPERUSER_EMAIL=admin@chatapp.local
```

### 6. Stop

```bash
docker compose down
```

To wipe all data (reset database, uploads, etc.):

```bash
docker compose down -v
```

---

## Option 2: Local Development (No Docker)

Run each service yourself. You need PostgreSQL, Redis, RabbitMQ, and MinIO running locally, or start just the infrastructure with Docker:

```bash
docker compose up postgres redis rabbitmq minio -d
```

### Backend

```bash
cd apps/backend

# Install dependencies
yarn install

# Create .env from the updated defaults
# (The .env file should already point to localhost:5432 for PostgreSQL)

# Run database migrations
yarn migration:run

# Seed the superuser
yarn seed

# Start dev server with hot reload
yarn start:dev
```

The backend runs on **port 3001** (set by `PORT=3001` in `.env`).

### Frontend

```bash
cd apps/frontend

# Install dependencies
yarn install

# Start Vite dev server
yarn start:dev
```

The frontend runs on **port 3000** and proxies `/api` and `/socket.io` requests to `localhost:3001` automatically.

### Access

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001/api |
| Swagger Docs | http://localhost:3001/api/docs |

---

## Option 3: Dev Mode with Docker Override

A `docker-compose.override.yml` is included that mounts local source directories into the containers for hot-reloading inside Docker:

```bash
docker compose up
```

The override mounts `apps/backend/src` and `apps/frontend/src` into the running containers, so changes you make locally are reflected immediately. This happens automatically — Docker Compose merges `docker-compose.override.yml` with `docker-compose.yml`.

---

## With Monitoring Stack

To add Prometheus, Grafana, and Loki for observability:

```bash
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

| Service | URL |
|---|---|
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 (admin/admin) |
| Loki | http://localhost:3100 |
| Backend Metrics | http://localhost/api/metrics |

---

## Environment Variables

All configuration lives in `.env.docker` at the repo root.

### Core settings

| Variable | Default | Description |
|---|---|---|
| `BACKEND_PORT` | `3001` | Backend API port |
| `FRONTEND_PORT` | `3000` | Frontend port |
| `NGINX_HTTP_PORT` | `80` | NGINX entry point |
| `ENVIRONMENT` | `development` | `development` or `PRODUCTION` |

### Database

| Variable | Default | Description |
|---|---|---|
| `DATABASE_HOST` | `postgres` (Docker) / `localhost` (local) | PostgreSQL host |
| `DATABASE_PORT` | `5432` | PostgreSQL port |
| `DATABASE_USERNAME` | `chatapp` | Database user |
| `DATABASE_PASSWORD` | `chatapp_secret` | Database password |
| `DATABASE_NAME` | `chatapp` | Database name |

### Auth

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | `change-this-to-a-random-jwt-secret` | Access token signing secret |
| `JWT_REFRESH_SECRET` | `change-this-to-a-random-refresh-secret` | Refresh token signing secret |
| `COOKIE_SECRET` | `change-this-to-a-random-secret` | Cookie signing secret |

### Superuser

| Variable | Default | Description |
|---|---|---|
| `SUPERUSER_USERNAME` | `admin` | Admin account username |
| `SUPERUSER_PASSWORD` | `changeme123!` | Admin account password |
| `SUPERUSER_EMAIL` | `admin@chatapp.local` | Admin account email |

### Infrastructure

| Variable | Default | Description |
|---|---|---|
| `REDIS_HOST` / `REDIS_PORT` | `redis` / `6379` | Redis connection |
| `RABBITMQ_HOST` / `RABBITMQ_PORT` | `rabbitmq` / `5672` | RabbitMQ connection |
| `MINIO_ENDPOINT` / `MINIO_PORT` | `minio` / `9000` | MinIO/S3 storage |
| `OLLAMA_HOST` | `http://ollama:11434` | Ollama AI service |

---

## Running Tests

### Backend unit tests

```bash
cd apps/backend
yarn test                          # All tests, parallel
yarn test -- --testPathPattern=auth # Specific module
yarn test:watch                    # Watch mode
yarn test:cov                      # With coverage
```

### Frontend tests

```bash
cd apps/frontend
yarn test
```

### E2E tests

Requires all services running:

```bash
npx playwright install             # First time only
npx playwright test                # Run E2E tests
```

---

## Database Migrations

```bash
cd apps/backend

# Generate a migration from entity changes
yarn migration:generate src/migrations/YourMigrationName

# Run pending migrations
yarn migration:run

# Revert the last migration
yarn migration:revert
```

In development, TypeORM's `synchronize: true` auto-creates the schema. In production, use migrations only.

---

## Troubleshooting

**Port already in use** — Change the port in `.env.docker`:
```
NGINX_HTTP_PORT=8080    # Use 8080 instead of 80
BACKEND_PORT=3002       # Use 3002 instead of 3001
```

**Backend won't start** — Check that PostgreSQL, Redis, and RabbitMQ are healthy:
```bash
docker compose ps
```

**Frontend shows blank page** — Make sure the backend is running and the Vite proxy can reach it. Check `apps/frontend/.env.development` points to the correct backend URL.

**Reset everything** — Remove all containers, volumes, and data:
```bash
docker compose down -v
docker compose up --build
```
