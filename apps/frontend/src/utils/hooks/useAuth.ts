import { useContext, useEffect, useState } from 'react';
import { getAuthUser, getAccessToken } from '../api';
import { AuthContext } from '../context/AuthContext';
import { socket } from '../context/SocketContext';

export function useAuth() {
  const [loading, setLoading] = useState(true);
  const { user, updateAuthUser } = useContext(AuthContext);
  const controller = new AbortController();

  useEffect(() => {
    getAuthUser()
      .then(({ data }) => {
        updateAuthUser(data);
        if (!socket.connected) {
          socket.auth = { token: getAccessToken() };
          socket.connect();
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, []);

  return { user, loading };
}
