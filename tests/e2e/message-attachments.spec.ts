import { test, expect } from '@playwright/test';
import {
  createTestUser,
  registerUserViaAPI,
  loginViaAPI,
  apiRequest,
  makeFriends,
} from '../setup/test-fixtures';

const BASE_URL = process.env.BASE_URL || 'http://localhost:80';

async function uploadMessageAttachment(
  path: string,
  content: string,
  token: string,
  fileName: string = 'test-file.txt',
  fileContent: string = 'Hello attachment test',
) {
  const buffer = Buffer.from(fileContent);
  const formData = new FormData();
  formData.append('content', content);
  formData.append('files', new Blob([buffer]), fileName);

  return fetch(`${BASE_URL}/api${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
}

test.describe('Message Attachments - DM', () => {
  test('should upload attachment in DM and verify via API', async () => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);
    await makeFriends(token1, user2.username, token2);

    const convRes = await apiRequest('POST', '/conversations', token1, {
      username: user2.username,
      message: 'Setup for attachment',
    });
    expect(convRes.ok).toBeTruthy();
    const conv = await convRes.json();

    // Send message with attachment
    const res = await uploadMessageAttachment(
      `/conversations/${conv.id}/messages`,
      'Message with file',
      token1,
      'e2e-test.txt',
      'E2E attachment content',
    );
    expect(res.ok).toBeTruthy();
    const msg = await res.json();
    expect(msg).toBeDefined();
  });

  test('should send message with multiple attachments in DM via API', async () => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);
    await makeFriends(token1, user2.username, token2);

    const convRes = await apiRequest('POST', '/conversations', token1, {
      username: user2.username,
      message: 'Multi attachment setup',
    });
    expect(convRes.ok).toBeTruthy();
    const conv = await convRes.json();

    // Send with 3 files
    const buffer = Buffer.from('test content');
    const formData = new FormData();
    formData.append('content', 'Multi file message');
    formData.append('files', new Blob([buffer]), 'file1.txt');
    formData.append('files', new Blob([buffer]), 'file2.txt');
    formData.append('files', new Blob([buffer]), 'file3.txt');

    const res = await fetch(`${BASE_URL}/api/conversations/${conv.id}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
      body: formData,
    });
    expect(res.ok).toBeTruthy();
    const msg = await res.json();
    expect(msg).toBeDefined();
  });
});

test.describe('Message Attachments - Groups', () => {
  test('should upload attachment in group message via API', async () => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);

    const groupRes = await apiRequest('POST', '/groups', token1, {
      title: 'Attachment Group',
      users: [user2.username],
    });
    expect(groupRes.ok).toBeTruthy();
    const group = await groupRes.json();

    const res = await uploadMessageAttachment(
      `/groups/${group.id}/messages`,
      'Group message with file',
      token1,
      'group-test.txt',
      'Group attachment content',
    );
    expect(res.ok).toBeTruthy();
    const msg = await res.json();
    expect(msg).toBeDefined();
  });
});

test.describe('Message Attachments - Limits', () => {
  test('should reject message with more than 5 attachments', async () => {
    const user1 = createTestUser();
    const user2 = createTestUser();
    await registerUserViaAPI(user1);
    await registerUserViaAPI(user2);

    const { accessToken: token1 } = await loginViaAPI(user1.username, user1.password);
    const { accessToken: token2 } = await loginViaAPI(user2.username, user2.password);
    await makeFriends(token1, user2.username, token2);

    const convRes = await apiRequest('POST', '/conversations', token1, {
      username: user2.username,
      message: 'Limit test setup',
    });
    expect(convRes.ok).toBeTruthy();
    const conv = await convRes.json();

    // Attempt to send 6 files
    const buffer = Buffer.from('test');
    const formData = new FormData();
    formData.append('content', 'Too many files');
    for (let i = 1; i <= 6; i++) {
      formData.append('files', new Blob([buffer]), `file${i}.txt`);
    }

    const res = await fetch(`${BASE_URL}/api/conversations/${conv.id}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
      body: formData,
    });
    expect(res.status).toBe(400);
  });
});
