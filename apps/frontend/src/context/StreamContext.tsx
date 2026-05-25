import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  StreamVideo,
  StreamVideoClient,
  User as StreamUser,
} from '@stream-io/video-react-sdk';
import { getAccessToken } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const StreamContext = createContext<{ client: StreamVideoClient | null; user: StreamUser | null }>({
  client: null,
  user: null,
});

export const useStreamClient = () => {
  const context = useContext(StreamContext);
  if (!context.client) {
    throw new Error('useStreamClient must be used within StreamProvider');
  }
  return context.client;
};

export const useStreamUser = () => {
  const context = useContext(StreamContext);
  return context.user;
};

interface StreamProviderProps {
  children: React.ReactNode;
}

export const StreamProvider: React.FC<StreamProviderProps> = ({ children }) => {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [user, setUser] = useState<StreamUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initStream = async () => {
      try {
        setIsLoading(true);
        // Lazy-load Stream.io CSS only when video service initializes
        await import('@stream-io/video-react-sdk/dist/css/styles.css');
        const token = getAccessToken();
        const response = await fetch(`${import.meta.env.VITE_API_URL}/stream/video-token`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Failed to get Stream token');
        }

        const { token: streamToken, userId, apiKey, firstName, lastName, username } = await response.json();

        // Create display name from firstName + lastName, fallback to username
        const displayName = firstName && lastName
          ? `${firstName} ${lastName}`
          : username || userId;

        const streamUser: StreamUser = {
          id: userId,
          name: displayName,
          image: undefined,
        };

        const streamClient = new StreamVideoClient({
          apiKey: apiKey,
          user: streamUser,
          token: streamToken,
        });

        setClient(streamClient);
        setUser(streamUser);
      } catch (err) {
        console.error('Failed to initialize Stream:', err);
        setError('Failed to initialize video call service');
      } finally {
        setIsLoading(false);
      }
    };

    initStream();
  }, []);

  if (isLoading) {
    return <div>Loading video service...</div>;
  }

  if (error || !client || !user) {
    return <div>Error: {error || 'Failed to initialize video service'}</div>;
  }

  return (
    <StreamContext.Provider value={{ client, user }}>
      <StreamVideo client={client}>
        {children}
      </StreamVideo>
    </StreamContext.Provider>
  );
};
