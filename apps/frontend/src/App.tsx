import { PropsWithChildren, lazy, Suspense, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import { AuthenticatedRoute } from './components/AuthenticatedRoute';
import { AuthContext } from './utils/context/AuthContext';
import { socket, SocketContext } from './utils/context/SocketContext';
import { User } from './utils/types';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './store';
import { enableMapSet } from 'immer';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ConversationPageGuard } from './guards/ConversationPageGuard';
import { GroupPageGuard } from './guards/GroupPageGuard';
import { ErrorBoundary } from './components/ErrorBoundary';

const ConversationPage = lazy(() =>
  import('./pages/conversations/ConversationPage').then((m) => ({
    default: m.ConversationPage,
  }))
);
const ConversationChannelPage = lazy(() =>
  import('./pages/conversations/ConversationChannelPage').then((m) => ({
    default: m.ConversationChannelPage,
  }))
);
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('./pages/RegisterPage').then((m) => ({
    default: m.RegisterPage,
  }))
);
const GroupChannelPage = lazy(() =>
  import('./pages/group/GroupChannelPage').then((m) => ({
    default: m.GroupChannelPage,
  }))
);
const GroupPage = lazy(() =>
  import('./pages/group/GroupPage').then((m) => ({ default: m.GroupPage }))
);
const AppPage = lazy(() =>
  import('./pages/AppPage').then((m) => ({ default: m.AppPage }))
);
const FriendsLayoutPage = lazy(() =>
  import('./pages/friends/FriendsLayoutPage').then((m) => ({
    default: m.FriendsLayoutPage,
  }))
);
const FriendRequestPage = lazy(() =>
  import('./pages/friends/FriendRequestPage').then((m) => ({
    default: m.FriendRequestPage,
  }))
);
const SettingsPage = lazy(() =>
  import('./pages/settings/SettingsPage').then((m) => ({
    default: m.SettingsPage,
  }))
);
const SettingsProfilePage = lazy(() =>
  import('./pages/settings/SettingsProfilePage').then((m) => ({
    default: m.SettingsProfilePage,
  }))
);
const SettingsAppearancePage = lazy(() =>
  import('./pages/settings/SettingsAppearancePage').then((m) => ({
    default: m.SettingsAppearancePage,
  }))
);
const CallsPage = lazy(() =>
  import('./pages/calls/CallsPage').then((m) => ({ default: m.CallsPage }))
);
const CurrentCallPage = lazy(() =>
  import('./pages/calls/CurrentCallPage').then((m) => ({
    default: m.CurrentCallPage,
  }))
);

enableMapSet();

type Props = {
  user?: User;
  setUser: React.Dispatch<React.SetStateAction<User | undefined>>;
  socket: Socket;
};

function AppWithProviders({
  children,
  user,
  setUser,
}: PropsWithChildren & Props) {
  return (
    <ReduxProvider store={store}>
      <AuthContext.Provider value={{ user, updateAuthUser: setUser }}>
        <SocketContext.Provider value={socket}>
          {children}
        </SocketContext.Provider>
      </AuthContext.Provider>
    </ReduxProvider>
  );
}

const LoadingFallback = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#1a1a2e',
      color: '#fff',
      fontFamily: 'sans-serif',
    }}
  >
    Loading...
  </div>
);

function App() {
  const [user, setUser] = useState<User>();
  return (
    <AppWithProviders user={user} setUser={setUser} socket={socket}>
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route element={<AuthenticatedRoute children={<AppPage />} />}>
              <Route path="conversations" element={<ConversationPage />}>
                <Route
                  path=":id"
                  element={
                    <ConversationPageGuard
                      children={<ConversationChannelPage />}
                    />
                  }
                />
              </Route>
              <Route path="groups" element={<GroupPage />}>
                <Route
                  path=":id"
                  element={<GroupPageGuard children={<GroupChannelPage />} />}
                />
              </Route>
              <Route path="friends" element={<FriendsLayoutPage />}>
                <Route path="requests" element={<FriendRequestPage />} />
                <Route path="blocked" element={<div>Blocked</div>} />
              </Route>
              <Route path="settings" element={<SettingsPage />}>
                <Route path="profile" element={<SettingsProfilePage />} />
                <Route path="appearance" element={<SettingsAppearancePage />} />
              </Route>
              <Route path="calls" element={<CallsPage />}>
                <Route path="current" element={<CurrentCallPage />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <ToastContainer theme="dark" />
    </AppWithProviders>
  );
}

export default App;
