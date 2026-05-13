import * as bcrypt from 'bcrypt';

export interface TestUser {
  id: string;
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}

let userCounter = 0;

export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  userCounter++;
  return {
    id: '',
    username: `testuser${userCounter}`,
    email: `test${userCounter}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: `User${userCounter}`,
    role: 'USER',
    ...overrides,
  };
}

export function createAdminUser(overrides: Partial<TestUser> = {}): TestUser {
  return createTestUser({ role: 'ADMIN', username: `admin${userCounter}`, ...overrides });
}

export function createTestConversation(participantIds: string[]) {
  return {
    participantIds,
  };
}

export function createTestMessage(senderId: string, content: string) {
  return {
    senderId,
    content,
  };
}

export function createTestGroup(creatorId: string, memberIds: string[]) {
  return {
    creatorId,
    title: `Test Group ${Date.now()}`,
    memberIds,
  };
}

export function resetCounters() {
  userCounter = 0;
}
