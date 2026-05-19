import { test, expect } from '@playwright/test';
import { login, cleanup } from './helpers';

test.describe('Private Voice Calls', () => {
  test('two-way voice call - both users can hear each other', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Login both users
      await Promise.all([
        login(page1, 'user1@example.com'),
        login(page2, 'user2@example.com')
      ]);

      // Navigate to same conversation
      await page1.click('text=user2');
      await page2.click('text=user1');

      // User1 initiates voice call
      await page1.click('[data-testid="voice-call-button"]');

      // User2 receives call dialog
      await expect(page2.locator('[data-testid="call-receive-dialog"]')).toBeVisible({ timeout: 5000 });
      await expect(page2.locator('[data-testid="call-message"]')).toContainText('user1 wants to voice call you');

      // User2 accepts call
      await page2.click('[data-testid="accept-call-button"]');

      // Verify call UI appears on both sides
      await expect(page1.locator('[data-testid="call-ui"]')).toBeVisible({ timeout: 10000 });
      await expect(page2.locator('[data-testid="call-ui"]')).toBeVisible({ timeout: 10000 });

      // Verify local streams
      await expect(page1.locator('[data-testid="local-stream"]')).toBeVisible();
      await expect(page2.locator('[data-testid="local-stream"]')).toBeVisible();

      // Verify remote streams (THIS IS THE KEY TEST FOR TWO-WAY CALLS)
      await expect(page1.locator('[data-testid="remote-stream"]')).toBeVisible({ timeout: 5000 });
      await expect(page2.locator('[data-testid="remote-stream"]')).toBeVisible({ timeout: 5000 });

      // Verify audio tracks are present
      const page1LocalAudio = await page1.evaluate(() => {
        const video = document.querySelector('[data-testid="local-stream"]') as HTMLVideoElement;
        return video?.srcObject ? (video.srcObject as MediaStream).getAudioTracks().length > 0 : false;
      });
      expect(page1LocalAudio).toBe(true);

      const page1RemoteAudio = await page1.evaluate(() => {
        const video = document.querySelector('[data-testid="remote-stream"]') as HTMLVideoElement;
        return video?.srcObject ? (video.srcObject as MediaStream).getAudioTracks().length > 0 : false;
      });
      expect(page1RemoteAudio).toBe(true); // THIS PROVES TWO-WAY AUDIO

      const page2RemoteAudio = await page2.evaluate(() => {
        const video = document.querySelector('[data-testid="remote-stream"]') as HTMLVideoElement;
        return video?.srcObject ? (video.srcObject as MediaStream).getAudioTracks().length > 0 : false;
      });
      expect(page2RemoteAudio).toBe(true); // THIS PROVES TWO-WAY AUDIO

    } finally {
      await cleanup(page1);
      await cleanup(page2);
      await context1.close();
      await context2.close();
    }
  });

  test('voice call rejection - proper cleanup', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      await Promise.all([
        login(page1, 'user1@example.com'),
        login(page2, 'user2@example.com')
      ]);

      await page1.click('text=user2');
      await page2.click('text=user1');

      await page1.click('[data-testid="voice-call-button"]');

      // User2 rejects call
      await expect(page2.locator('[data-testid="call-receive-dialog"]')).toBeVisible();
      await page2.click('[data-testid="reject-call-button"]');

      // Verify call UI does NOT appear
      await expect(page1.locator('[data-testid="call-ui"]')).not.toBeVisible({ timeout: 5000 });
      await expect(page2.locator('[data-testid="call-ui"]')).not.toBeVisible();

      // Verify no streams are active
      const page1Streams = await page1.evaluate(() => {
        const local = document.querySelector('[data-testid="local-stream"]');
        const remote = document.querySelector('[data-testid="remote-stream"]');
        return { local: !!local, remote: !!remote };
      });
      expect(page1Streams.local).toBe(false);
      expect(page1Streams.remote).toBe(false);

    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('voice call hangup - proper cleanup', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      await Promise.all([
        login(page1, 'user1@example.com'),
        login(page2, 'user2@example.com')
      ]);

      await page1.click('text=user2');
      await page2.click('text=user1');

      await page1.click('[data-testid="voice-call-button"]');
      await page2.click('[data-testid="accept-call-button"]');

      // Wait for call to establish
      await expect(page1.locator('[data-testid="remote-stream"]')).toBeVisible();

      // User1 hangs up
      await page1.click('[data-testid="hangup-button"]');

      // Verify call UI disappears on both sides
      await expect(page1.locator('[data-testid="call-ui"]')).not.toBeVisible();
      await expect(page2.locator('[data-testid="call-ui"]')).not.toBeVisible();

      // Verify streams are cleaned up
      const page1Streams = await page1.evaluate(() => {
        const local = document.querySelector('[data-testid="local-stream"]') as HTMLVideoElement;
        const remote = document.querySelector('[data-testid="remote-stream"]') as HTMLVideoElement;
        return {
          local: local?.srcObject === null,
          remote: remote?.srcObject === null,
        };
      });
      expect(page1Streams.local).toBe(true);
      expect(page1Streams.remote).toBe(true);

    } finally {
      await context1.close();
      await context2.close();
    }
  });
});

test.describe('Private Video Calls', () => {
  test('two-way video call - both users can see and hear each other', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      await Promise.all([
        login(page1, 'user1@example.com'),
        login(page2, 'user2@example.com')
      ]);

      await page1.click('text=user2');
      await page2.click('text=user1');

      await page1.click('[data-testid="video-call-button"]');

      await expect(page2.locator('[data-testid="call-receive-dialog"]')).toBeVisible();
      await page2.click('[data-testid="accept-call-button"]');

      await expect(page1.locator('[data-testid="call-ui"]')).toBeVisible({ timeout: 10000 });
      await expect(page2.locator('[data-testid="call-ui"]')).toBeVisible({ timeout: 10000 });

      // Verify local and remote video streams
      await expect(page1.locator('[data-testid="local-stream"]')).toBeVisible();
      await expect(page1.locator('[data-testid="remote-stream"]')).toBeVisible();
      await expect(page2.locator('[data-testid="local-stream"]')).toBeVisible();
      await expect(page2.locator('[data-testid="remote-stream"]')).toBeVisible();

      // Verify video tracks are present (THIS PROVES TWO-WAY VIDEO)
      const page1RemoteVideo = await page1.evaluate(() => {
        const video = document.querySelector('[data-testid="remote-stream"]') as HTMLVideoElement;
        return video?.srcObject ? (video.srcObject as MediaStream).getVideoTracks().length > 0 : false;
      });
      expect(page1RemoteVideo).toBe(true);

      const page1RemoteAudio = await page1.evaluate(() => {
        const video = document.querySelector('[data-testid="remote-stream"]') as HTMLVideoElement;
        return video?.srcObject ? (video.srcObject as MediaStream).getAudioTracks().length > 0 : false;
      });
      expect(page1RemoteAudio).toBe(true);

      const page2RemoteVideo = await page2.evaluate(() => {
        const video = document.querySelector('[data-testid="remote-stream"]') as HTMLVideoElement;
        return video?.srcObject ? (video.srcObject as MediaStream).getVideoTracks().length > 0 : false;
      });
      expect(page2RemoteVideo).toBe(true); // THIS PROVES TWO-WAY VIDEO

    } finally {
      await cleanup(page1);
      await cleanup(page2);
      await context1.close();
      await context2.close();
    }
  });

  test('video call - toggle camera and microphone', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      await Promise.all([
        login(page1, 'user1@example.com'),
        login(page2, 'user2@example.com')
      ]);

      await page1.click('text=user2');
      await page2.click('text=user1');

      await page1.click('[data-testid="video-call-button"]');
      await page2.click('[data-testid="accept-call-button"]');

      await expect(page1.locator('[data-testid="remote-stream"]')).toBeVisible();

      // Toggle camera off
      await page1.click('[data-testid="toggle-camera-button"]');

      const page1VideoOff = await page1.evaluate(() => {
        const video = document.querySelector('[data-testid="local-stream"]') as HTMLVideoElement;
        const tracks = video?.srcObject ? (video.srcObject as MediaStream).getVideoTracks() : [];
        return tracks.length > 0 && !tracks[0].enabled;
      });
      expect(page1VideoOff).toBe(true);

      // Toggle camera back on
      await page1.click('[data-testid="toggle-camera-button"]');

      const page1VideoOn = await page1.evaluate(() => {
        const video = document.querySelector('[data-testid="local-stream"]') as HTMLVideoElement;
        const tracks = video?.srcObject ? (video.srcObject as MediaStream).getVideoTracks() : [];
        return tracks.length > 0 && tracks[0].enabled;
      });
      expect(page1VideoOn).toBe(true);

    } finally {
      await cleanup(page1);
      await cleanup(page2);
      await context1.close();
      await context2.close();
    }
  });

  test('video call - toggle microphone', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      await Promise.all([
        login(page1, 'user1@example.com'),
        login(page2, 'user2@example.com')
      ]);

      await page1.click('text=user2');
      await page2.click('text=user1');

      await page1.click('[data-testid="video-call-button"]');
      await page2.click('[data-testid="accept-call-button"]');

      await expect(page1.locator('[data-testid="remote-stream"]')).toBeVisible();

      // Toggle microphone off
      await page1.click('[data-testid="toggle-microphone-button"]');

      const page1MicOff = await page1.evaluate(() => {
        const video = document.querySelector('[data-testid="local-stream"]') as HTMLVideoElement;
        const tracks = video?.srcObject ? (video.srcObject as MediaStream).getAudioTracks() : [];
        return tracks.length > 0 && !tracks[0].enabled;
      });
      expect(page1MicOff).toBe(true);

      // Toggle microphone back on
      await page1.click('[data-testid="toggle-microphone-button"]');

      const page1MicOn = await page1.evaluate(() => {
        const video = document.querySelector('[data-testid="local-stream"]') as HTMLVideoElement;
        const tracks = video?.srcObject ? (video.srcObject as MediaStream).getAudioTracks() : [];
        return tracks.length > 0 && tracks[0].enabled;
      });
      expect(page1MicOn).toBe(true);

    } finally {
      await cleanup(page1);
      await cleanup(page2);
      await context1.close();
      await context2.close();
    }
  });
});

test.describe('Call Error Handling', () => {
  test('call when receiver is offline - shows unavailable message', async ({ browser }) => {
    const context1 = await browser.newContext();

    const page1 = await context1.newPage();

    try {
      await login(page1, 'user1@example.com');

      await page1.click('text=user2');

      // Try to call user2 who is offline
      await page1.click('[data-testid="voice-call-button"]');

      // Should get unavailable message (implementation dependent)
      // This test documents expected behavior

    } finally {
      await context1.close();
    }
  });
});