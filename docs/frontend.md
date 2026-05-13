# Frontend Guide

## Tech Stack

| Technology         | Purpose                            |
|--------------------|------------------------------------|
| React 18           | UI framework                       |
| TypeScript         | Type safety                        |
| Vite 6             | Build tool and dev server          |
| Redux Toolkit      | State management                   |
| React Router v6    | Client-side routing (lazy-loaded)  |
| Socket.IO Client   | WebSocket real-time communication  |
| PeerJS             | WebRTC voice and video calls       |
| styled-components  | CSS-in-JS styling (primary)        |
| SCSS Modules       | CSS Modules for component styles   |
| Axios              | HTTP client with JWT interceptor   |
| React Hook Form    | Form management                    |
| React Toastify     | Toast notifications                |

---

## Directory Structure

```
src/
├── App.tsx                    # Root component, route definitions, providers
├── index.tsx                  # Entry point
├── index.css                  # Global styles
├── vite-env.d.ts              # Vite type declarations
│
├── pages/                     # Route-level page components
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── AppPage.tsx            # Authenticated layout shell
│   ├── conversations/
│   │   ├── ConversationPage.tsx       # Sidebar + outlet
│   │   └── ConversationChannelPage.tsx  # Message panel
│   ├── group/
│   │   ├── GroupPage.tsx              # Group sidebar + outlet
│   │   └── GroupChannelPage.tsx       # Group message panel
│   ├── friends/
│   │   ├── FriendsLayoutPage.tsx      # Friends layout + outlet
│   │   ├── FriendsPage.tsx            # Friend list
│   │   └── FriendRequestPage.tsx      # Incoming/outgoing requests
│   ├── settings/
│   │   ├── SettingsPage.tsx           # Settings layout + outlet
│   │   ├── SettingsProfilePage.tsx    # Profile editing
│   │   └── SettingsAppearancePage.tsx # Theme toggle
│   ├── calls/
│   │   ├── CallsPage.tsx              # Call history
│   │   └── CurrentCallPage.tsx        # Active call view
│   └── onboarding/
│       └── OnboardingPage.tsx         # New user profile setup
│
├── components/                # Reusable UI components
│   ├── AuthenticatedRoute.tsx # Auth guard wrapper
│   ├── ErrorBoundary.tsx      # Error boundary wrapper
│   ├── avatars/               # Avatar upload components
│   ├── calls/                 # Call UI (receive dialog, sidebar)
│   ├── context-menus/         # Right-click context menus
│   ├── conversations/         # Conversation panels and items
│   ├── forms/                 # Form components (login, register, etc.)
│   ├── friends/               # Friend list and request components
│   ├── group-messages/        # Group message container
│   ├── groups/                # Group sidebar items
│   ├── inputs/                # Message text input
│   ├── messages/              # Message display, editing, attachments
│   ├── modals/                # Modal dialogs (create group, etc.)
│   ├── navbar/                # Navigation bars
│   ├── recipients/            # Recipient selection fields
│   ├── settings/              # Profile settings components
│   ├── sidebars/              # Sidebar layouts and items
│   └── users/                 # User avatar display
│
├── store/                     # Redux Toolkit state
│   ├── index.ts               # Store configuration
│   ├── conversationSlice.ts
│   ├── selectedSlice.ts
│   ├── messageContainerSlice.ts
│   ├── groupSlice.ts
│   ├── groupMessageSlice.ts
│   ├── groupRecipientsSidebarSlice.ts
│   ├── messages/
│   │   ├── messageSlice.ts
│   │   └── messageThunk.ts
│   ├── friends/
│   │   ├── friendsSlice.ts
│   │   └── friendsThunk.ts
│   ├── call/
│   │   └── callSlice.ts
│   ├── message-panel/
│   │   └── messagePanelSlice.ts
│   ├── rate-limit/
│   │   └── rateLimitSlice.ts
│   ├── settings/
│   │   └── settingsSlice.ts
│   └── system-messages/
│       └── systemMessagesSlice.ts
│
├── guards/                    # Route guards
│   ├── ConversationPageGuard.tsx
│   └── GroupPageGuard.tsx
│
└── utils/
    ├── api.ts                 # Axios client with JWT refresh interceptor
    ├── types.ts               # Centralized TypeScript types
    ├── constants.ts           # App constants
    ├── helpers.ts             # Utility functions
    ├── context/
    │   ├── AuthContext.tsx     # Auth state provider
    │   ├── SocketContext.tsx   # Socket.IO instance provider
    │   └── MessageMenuContext.tsx
    ├── hooks/
    │   ├── index.ts           # useKeydown, useHandleClick, useBeforeUnload
    │   ├── useAuth.ts
    │   ├── useConversationGuard.ts
    │   ├── useDebounce.ts
    │   ├── useGroupGuard.ts
    │   ├── useToast.tsx
    │   └── sockets/
    │       ├── call/          # Voice/video call hooks
    │       └── friend-requests/
    ├── styles/                # styled-components style definitions
    └── themes/
        └── index.ts           # DarkTheme / LightTheme definitions
```

---

## Route Structure

All routes use React Router v6 with lazy-loaded page components:

```
/register                   → RegisterPage
/login                      → LoginPage
/conversations              → ConversationPage (sidebar)
/conversations/:id          → ConversationChannelPage (messages)
/groups                     → GroupPage (sidebar)
/groups/:id                 → GroupChannelPage (messages)
/friends                    → FriendsLayoutPage
/friends/requests           → FriendRequestPage
/friends/blocked            → Blocked users
/settings                   → SettingsPage
/settings/profile           → SettingsProfilePage
/settings/appearance        → SettingsAppearancePage
/calls                      → CallsPage
/calls/current              → CurrentCallPage
```

Authenticated routes are wrapped in `<AuthenticatedRoute>` which checks for a valid user context. Nested routes use `<Outlet />` for sidebar + content layout patterns.

---

## State Management

Redux Toolkit with 14 slices managing different domains:

| Slice                      | State                                  |
|----------------------------|----------------------------------------|
| `conversation`             | Conversation list, selected conversation |
| `messages`                 | Message list, loading state            |
| `selectedConversationType` | Current tab (conversations / groups / friends / settings / calls) |
| `friends`                  | Friend list, friend requests           |
| `groups`                   | Group list, selected group             |
| `groupMessages`            | Group message list                     |
| `messageContainer`         | Message editing state, selected message |
| `groupSidebar`             | Group recipients sidebar state         |
| `rateLimit`                | Rate limiting flags per conversation   |
| `messagePanel`             | Message panel UI state (editing, replying) |
| `systemMessages`           | System-level messages (info, warning, error) |
| `settings`                 | Theme and user preferences             |
| `call`                     | Active call state, call type, streams  |

Async operations use `createAsyncThunk` for API calls (e.g., `fetchConversations`, `fetchMessages`).

---

## API Layer

The API client (`src/utils/api.ts`) is a configured Axios instance:

- **Base URL**: Read from `VITE_API_URL` env var
- **Auth**: JWT access token added via request interceptor
- **Auto-refresh**: On 401 response, automatically calls `/auth/refresh` and retries the original request
- **Session**: Uses `withCredentials: true` for HTTP-only cookie (refresh token)
- **Token storage**: Access token stored in memory (not localStorage)

### Example API Call

```typescript
export const getConversations = () =>
  axiosClient.get<Conversation[]>('/conversations', config);
```

---

## WebSocket Integration

### Connection

Socket.IO connects on app initialization with JWT auth:

```typescript
const socket = io(VITE_WEBSOCKET_URL, {
  auth: { token: getAccessToken() },
});
```

The socket is provided via `SocketContext` and available throughout the component tree.

### WebSocket Hooks

Custom hooks in `src/utils/hooks/sockets/` manage socket event listeners:

| Hook                            | Event                        | Purpose                          |
|---------------------------------|------------------------------|----------------------------------|
| `useVoiceCall`                  | `onVoiceCall`                | Incoming voice call              |
| `useVoiceCallAccepted`          | `onVoiceCallAccept`          | Call was accepted                |
| `useVoiceCallHangUp`            | `onVoiceCallHangUp`          | Call ended                       |
| `useVoiceCallRejected`          | `onVoiceCallReject`          | Call rejected                    |
| `useVideoCall`                  | `onVideoCall`                | Incoming video call              |
| `useVideoCallAccept`            | `onVideoCallAccept`          | Video call accepted              |
| `useVideoCallHangUp`            | `onVideoCallHangUp`          | Video call ended                 |
| `useVideoCallRejected`          | `onVideoCallReject`          | Video call rejected              |
| `useFriendRequestReceived`      | `onFriendRequestReceived`    | New friend request               |

Each hook follows the same pattern: registers a socket listener on mount, cleans up on unmount, and dispatches Redux actions in response.

---

## Theming

The app supports dark and light themes via styled-components theming:

- Theme definitions in `src/utils/themes/index.ts`
- `DarkTheme` and `LightTheme` objects define colors, spacing, and typography
- Theme is toggled via Redux `settings` slice
- Persisted to local storage and synced to the server

---

## Environment Variables

| Variable                  | Description                          | Default                        |
|---------------------------|--------------------------------------|--------------------------------|
| `VITE_API_URL`            | Backend API base URL                 | `http://localhost:3001/api`    |
| `VITE_WEBSOCKET_URL`      | WebSocket server URL                 | `http://localhost:3001`        |

In Docker, these are set to use the nginx reverse proxy: `http://localhost/api` and `http://localhost`.
