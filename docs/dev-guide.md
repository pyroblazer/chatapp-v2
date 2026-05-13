# ChatApp Developer Guide

## Quick Start

### Prerequisites
- Docker + Docker Compose
- Node.js 18+
- Yarn

### Setup

1. Clone the repository
2. Copy `.env.docker` and customize if needed:
   ```bash
   cp .env.docker .env.docker.local
   ```
3. Start all services:
   ```bash
   docker compose up
   ```
4. Access:
   - Frontend: http://localhost (via NGINX) or http://localhost:3000
   - Backend API: http://localhost:3001/api
   - MinIO Console: http://localhost:9001
   - RabbitMQ Management: http://localhost:15672

### Accessing the Superuser Account

After running `docker compose up`, a superuser account is automatically created via the seed script.

**Default Credentials:**
- Username: `admin`
- Password: `changeme123!`
- Role: ADMIN (full access to all admin endpoints)

**Logging In:**
1. Open http://localhost
2. Navigate to `/login`
3. Enter the credentials above

**Changing Default Credentials:**
Set these environment variables in `.env.docker` before running `docker compose up`:
- `SUPERUSER_USERNAME`
- `SUPERUSER_PASSWORD`
- `SUPERUSER_EMAIL`

### Admin Capabilities

The superuser can access all admin endpoints under `/api/admin/*`:
- User management (list, ban, role changes)
- Message moderation (delete any message)
- Report review
- Audit log access
- Bot management

### Running Without Docker

**Backend:**
```bash
cd apps/backend
yarn install
yarn start:dev
```

**Frontend:**
```bash
cd apps/frontend
yarn install
yarn start:dev
```

Requires PostgreSQL, Redis, MinIO, and RabbitMQ running locally.

### Running Tests

```bash
# Backend tests (parallel)
cd apps/backend
yarn test

# Frontend tests
cd apps/frontend
yarn test

# E2E tests
yarn test:e2e
```

### Environment Variables

See `.env.docker` for the complete list with documentation.
