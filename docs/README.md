# ChatApp Documentation

## Quick Links

- [Architecture Overview](architecture.md) — System design, event system, infrastructure, module patterns
- [How to Run](run-guide.md) — Docker, local dev, environment variables, troubleshooting
- [Developer Guide](dev-guide.md) — Superuser access, testing, architecture overview
- [Frontend Guide](frontend.md) — React architecture, state management, routing, components

## Feature Guides

Each guide covers both the developer API and user-facing functionality:

### Core Features
- [Authentication](features/auth.md) — Registration, login, JWT tokens, sessions
- [Conversations](features/conversations.md) — Direct messaging, message CRUD
- [Groups](features/groups.md) — Group chats, member management, roles
- [Friends](features/friends.md) — Friend requests, friend list management
- [Calls](features/calls.md) — Voice and video calls via WebRTC

### Messaging Features
- [Reactions](features/reactions.md) — Emoji reactions on messages
- [Read Receipts](features/read-receipts.md) — Message delivery and read status
- [Threads](features/threads.md) — Message threading and replies
- [Search](features/search.md) — Full-text message search
- [File Uploads](features/file-uploads.md) — Attachments, images, presigned URLs, thumbnails

### System Features
- [Notifications](features/notifications.md) — Real-time and queued notifications
- [Presence](features/presence.md) — Online/offline status tracking, custom status messages
- [Settings](features/settings.md) — Profile, avatar/banner, appearance, onboarding
- [Admin Tools](features/admin.md) — Moderation, reports, audit logs, role management
- [AI Bot](features/ai-bot.md) — Ollama-powered AI assistant with streaming responses

## For Developers

Each feature guide includes:
- REST API endpoints with request/response examples
- WebSocket event names and payload formats
- Database entities and relationships
- Configuration options and environment variables

## For Users

Each feature guide includes:
- Step-by-step usage instructions
- UI descriptions and navigation tips
- Tips and shortcuts
