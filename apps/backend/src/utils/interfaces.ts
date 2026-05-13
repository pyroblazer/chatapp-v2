import type { User } from './typeorm';
import type { Socket } from 'socket.io';

export interface AuthenticatedSocket extends Socket {
  user?: User;
}
