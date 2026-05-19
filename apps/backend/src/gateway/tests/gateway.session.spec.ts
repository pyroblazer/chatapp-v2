import { GatewaySessionManager } from '../gateway.session';
import type { AuthenticatedSocket } from '../../utils/interfaces';

const makeSocket = (userId: string): AuthenticatedSocket =>
  ({
    id: `socket-${userId}`,
    user: { id: userId, username: userId, peerId: '' },
    emit: jest.fn(),
  }) as unknown as AuthenticatedSocket;

describe('GatewaySessionManager', () => {
  let manager: GatewaySessionManager;

  beforeEach(() => {
    manager = new GatewaySessionManager();
  });

  // --- socket session ---

  it('should store and retrieve a user socket', () => {
    const socket = makeSocket('user-1');
    manager.setUserSocket('user-1', socket);
    expect(manager.getUserSocket('user-1')).toBe(socket);
  });

  it('should return undefined for an unknown user', () => {
    expect(manager.getUserSocket('ghost')).toBeUndefined();
  });

  it('should remove a user socket', () => {
    const socket = makeSocket('user-1');
    manager.setUserSocket('user-1', socket);
    manager.removeUserSocket('user-1');
    expect(manager.getUserSocket('user-1')).toBeUndefined();
  });

  it('should expose all sockets via getSockets', () => {
    const s1 = makeSocket('user-1');
    const s2 = makeSocket('user-2');
    manager.setUserSocket('user-1', s1);
    manager.setUserSocket('user-2', s2);
    expect(manager.getSockets().size).toBe(2);
  });

  // --- in-call tracking ---

  it('should mark a user as in-call', () => {
    manager.setUserInCall('user-1', true);
    expect(manager.isUserInCall('user-1')).toBe(true);
  });

  it('should mark a user as not in-call', () => {
    manager.setUserInCall('user-1', true);
    manager.setUserInCall('user-1', false);
    expect(manager.isUserInCall('user-1')).toBe(false);
  });

  it('should return false for a user never set in-call', () => {
    expect(manager.isUserInCall('nobody')).toBe(false);
  });

  it('should track multiple users in calls independently', () => {
    manager.setUserInCall('user-1', true);
    manager.setUserInCall('user-2', false);
    expect(manager.isUserInCall('user-1')).toBe(true);
    expect(manager.isUserInCall('user-2')).toBe(false);
  });

  it('should clear in-call when user disconnects (removeUserSocket)', () => {
    const socket = makeSocket('user-1');
    manager.setUserSocket('user-1', socket);
    manager.setUserInCall('user-1', true);
    // Simulate disconnect: clear in-call then remove socket (mirrors handleDisconnect)
    manager.setUserInCall('user-1', false);
    manager.removeUserSocket('user-1');
    expect(manager.isUserInCall('user-1')).toBe(false);
    expect(manager.getUserSocket('user-1')).toBeUndefined();
  });

  // --- in-memory presence fallback (no Redis) ---

  it('should report user online via isUserOnline when socket exists', async () => {
    const socket = makeSocket('user-1');
    manager.setUserSocket('user-1', socket);
    expect(await manager.isUserOnline('user-1')).toBe(true);
  });

  it('should report user offline via isUserOnline after socket removed', async () => {
    const socket = makeSocket('user-1');
    manager.setUserSocket('user-1', socket);
    manager.removeUserSocket('user-1');
    expect(await manager.isUserOnline('user-1')).toBe(false);
  });

  it('should include user in getOnlineUsers when socket exists', async () => {
    const socket = makeSocket('user-1');
    manager.setUserSocket('user-1', socket);
    const online = await manager.getOnlineUsers();
    expect(online['user-1']).toBeDefined();
  });
});
