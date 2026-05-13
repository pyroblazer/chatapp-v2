# Authentication

## Overview

The authentication system handles user registration, login, token management, and session lifecycle. It uses JSON Web Tokens (JWT) for stateless authentication with a dual-token strategy: short-lived access tokens and long-lived refresh tokens. All protected API endpoints and WebSocket connections require a valid access token.

---

## API Endpoints

### Register a New User

```
POST /api/auth/register
```

Creates a new user account and returns access/refresh tokens.

**Request Body:**

| Field     | Type   | Required | Description                        |
|-----------|--------|----------|------------------------------------|
| `username`| string | Yes      | Unique username (3-30 characters)  |
| `email`   | string | Yes      | Valid email address                |
| `password`| string | Yes      | Password (min 8 characters)        |

**Response (201):**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "email": "john@example.com"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error Responses:**

- `400` — Validation error (missing/invalid fields)
- `409` — Username or email already exists

---

### Login

```
POST /api/auth/login
```

Authenticates an existing user and returns new tokens.

**Request Body:**

| Field     | Type   | Required | Description           |
|-----------|--------|----------|-----------------------|
| `email`   | string | Yes      | Registered email      |
| `password`| string | Yes      | Account password      |

**Response (200):**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "email": "john@example.com"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error Responses:**

- `401` — Invalid email or password

---

### Refresh Token

```
POST /api/auth/refresh
```

Exchanges a valid refresh token for a new access token and refresh token pair. This should be called before the access token expires to maintain an active session.

**Request Body:**

| Field          | Type   | Required | Description               |
|----------------|--------|----------|---------------------------|
| `refreshToken` | string | Yes      | Current refresh token     |

**Response (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error Responses:**

- `401` — Invalid or expired refresh token

---

### Logout

```
POST /api/auth/logout
```

Invalidates the current refresh token, ending the session. The client should discard both access and refresh tokens.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

| Field          | Type   | Required | Description               |
|----------------|--------|----------|---------------------------|
| `refreshToken` | string | Yes      | Refresh token to revoke   |

**Response (200):**

```json
{
  "message": "Logged out successfully"
}
```

---

### Get Current User

```
GET /api/auth/me
```

Returns the authenticated user's profile based on the access token.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "johndoe",
  "email": "john@example.com",
  "avatar": "https://minio.example.com/avatars/...",
  "role": "USER",
  "createdAt": "2025-01-15T10:30:00Z"
}
```

**Error Responses:**

- `401` — Missing or invalid token

---

## Token Details

### JWT Structure

The access token payload contains:

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "username": "johndoe",
  "iat": 1700000000,
  "exp": 1700000900
}
```

| Field      | Description                                  |
|------------|----------------------------------------------|
| `sub`      | User ID (UUID)                               |
| `username` | User's username                              |
| `iat`      | Issued-at timestamp                          |
| `exp`      | Expiration timestamp                         |

### Token Lifetimes

| Token          | Lifetime | Purpose                                     |
|----------------|----------|---------------------------------------------|
| Access Token   | 15 min   | Authorizes API and WebSocket requests       |
| Refresh Token  | 7 days   | Obtains new access tokens without re-login  |

### Token Refresh Flow

1. Client stores both tokens securely (httpOnly cookie or secure storage).
2. Before the access token expires, the client calls `POST /api/auth/refresh`.
3. The server validates the refresh token, issues a new token pair, and invalidates the old refresh token.
4. If the refresh token has expired, the client must re-authenticate via `POST /api/auth/login`.

---

## WebSocket Authentication

WebSocket connections require authentication via the socket handshake. Include the access token as a query parameter:

```
wss://example.com/socket?token=<accessToken>
```

The server validates the token during the handshake. If invalid, the connection is rejected with a `401` code. Token expiry during an active WebSocket session does not disconnect the client; however, the client should refresh the token and reconnect if disconnected.

---

## WebSocket Events

No dedicated auth-related WebSocket events are emitted. Authentication is handled at the transport layer during the connection handshake.

---

## User Guide

### Registering an Account

1. Open the chat application and navigate to the registration page.
2. Enter a unique username, your email address, and a password (at least 8 characters).
3. Click **Sign Up**.
4. Upon successful registration, you are automatically logged in and redirected to the main chat interface.

### Logging In

1. Navigate to the login page.
2. Enter your email and password.
3. Click **Log In**.
4. You are redirected to the main chat interface.

### Staying Logged In

The application automatically refreshes your session in the background. As long as you use the app at least once every 7 days, you will remain logged in. If your session expires, you will be prompted to log in again.

### Logging Out

1. Click your profile icon in the top-right corner.
2. Select **Log Out** from the dropdown menu.
3. Your session is ended on all tabs.

---

## Configuration

### Environment Variables

| Variable                | Description                               | Default    |
|-------------------------|-------------------------------------------|------------|
| `JWT_SECRET`            | Secret key for signing access tokens      | Required   |
| `JWT_REFRESH_SECRET`    | Secret key for signing refresh tokens     | Required   |
| `JWT_ACCESS_EXPIRY`     | Access token expiration                   | `15m`      |
| `JWT_REFRESH_EXPIRY`    | Refresh token expiration                  | `7d`       |
| `BCRYPT_SALT_ROUNDS`    | Salt rounds for password hashing          | `12`       |
