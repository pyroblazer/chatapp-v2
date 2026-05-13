import { createContext } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '../api';

export const createSocket = (): Socket =>
  io(import.meta.env.VITE_WEBSOCKET_URL || window.location.origin, {
    auth: { token: getAccessToken() },
    autoConnect: false,
  });

export const socket = createSocket();
export const SocketContext = createContext(socket);
