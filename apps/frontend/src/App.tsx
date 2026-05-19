import { PropsWithChildren, lazy, Suspense, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import { AuthenticatedRoute } from './components/AuthenticatedRoute';
import { AuthContext } from './utils/context/AuthContext';
import { socket, SocketContext } from './utils/context/SocketContext';
import { logoutUser, setOnAuthFailure } from './utils/api';
import { User } from './utils/types';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './store';
import { enableMapSet } from 'immer';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ConversationPageGuard } from './guards/ConversationPageGuard';
import { GroupPageGuard } from './guards/GroupPageGuard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider } from 'styled-components';
import { DarkTheme } from './utils/themes';

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
const BlockedPage = lazy(() =>
  import('./pages/friends/BlockedPage').then((m) => ({
    default: m.BlockedPage,
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
  socket,
}: PropsWithChildren & Props) {
  const handleLogout = async () => {
    try { await logoutUser(); } catch {}
    socket.disconnect();
    setUser(undefined);
  };
  return (
    <ReduxProvider store={store}>
      <AuthContext.Provider value={{ user, updateAuthUser: setUser, logout: handleLogout }}>
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
      backgroundColor: '#1a1a1a',
      color: '#fff',
      fontFamily: 'sans-serif',
    }}
  >
    Loading...
  </div>
);

function AuthFailureHandler({
  setUser,
  socket,
}: {
  setUser: React.Dispatch<React.SetStateAction<User | undefined>>;
  socket: Socket;
}) {
  const navigate = useNavigate();
  useEffect(() => {
    setOnAuthFailure(() => {
      socket.disconnect();
      setUser(undefined);
      navigate('/login', { replace: true });
    });
  }, []);
  return null;
}

function App() {
  const [user, setUser] = useState<User>();
  return (
    <AppWithProviders user={user} setUser={setUser} socket={socket}>
      <ThemeProvider theme={DarkTheme}>
      <ErrorBoundary>
        <AuthFailureHandler setUser={setUser} socket={socket} />
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
                <Route path="blocked" element={<BlockedPage />} />
              </Route>
              <Route path="settings" element={<SettingsPage />}>
                <Route path="profile" element={<SettingsProfilePage />} />
                <Route path="appearance" element={<SettingsAppearancePage />} />
              </Route>
              <Route path="calls" element={<CallsPage />} />
              <Route path="*" element={<Navigate to="/conversations" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
      </ThemeProvider>
      <ToastContainer theme="dark" />
    </AppWithProviders>
  );
}

export default App;
