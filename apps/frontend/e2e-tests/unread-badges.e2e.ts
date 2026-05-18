import { test, expect } from '@playwright/test';
import { loginAsUser, waitForBadgeUpdate } from './helpers';

test.describe('Unread Message Badges', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, 'userA');
  });

  test('should display no badges when no unread messages', async ({ page }) => {
    await page.goto('/conversations');

    // Check nav icon has no badge
    await expect(page.locator('[data-testid="conversations-nav-icon"] .icon-badge'))
      .not.toBeVisible();

    // Check Private tab has no badge
    await expect(page.locator('[data-testid="private-tab"] .icon-badge'))
      .not.toBeVisible();
  });

  test('should display badge on conversation row with unread messages', async ({ page }) => {
    await page.goto('/conversations');

    // Simulate receiving a message for conversation-1
    await page.evaluate(() => {
      const event = new CustomEvent('unread-update', {
        detail: { conversationId: 'conv-1', unreadCount: 5 }
      });
      window.dispatchEvent(event);
    });

    // Wait for badge to appear
    await waitForBadgeUpdate(page, '5');

    // Check badge is visible
    await expect(page.locator('[data-testid="conversations-nav-icon"] .icon-badge'))
      .toHaveText('5');
  });

  test('should display "99+" for counts exceeding 99', async ({ page }) => {
    await page.goto('/conversations');

    // Set high unread count
    await page.evaluate(() => {
      window.__SET_UNREAD_COUNT__('conv-1', 150);
    });

    // Should show 99+
    await expect(page.locator('[data-testid="conversation-item-1"] .icon-badge'))
      .toHaveText('99+');
  });

  test('should clear badge when opening conversation', async ({ page }) => {
    await page.goto('/conversations');

    // Set unread count
    await page.evaluate(() => {
      window.__SET_UNREAD_COUNT__('conv-1', 3);
    });

    // Badge should be visible
    await expect(page.locator('[data-testid="conversations-nav-icon"] .icon-badge'))
      .toHaveText('3');

    // Open conversation
    await page.locator('[data-testid="conversation-item-1"]').click();

    // Badge should clear immediately
    await expect(page.locator('[data-testid="conversations-nav-icon"] .icon-badge'))
      .not.toBeVisible();
  });

  test('should display badges on both Private and Group tabs', async ({ page }) => {
    await page.goto('/conversations');

    // Set conversation unread
    await page.evaluate(() => {
      window.__SET_UNREAD_COUNT__('conv-1', 5);
    });

    // Set group unread
    await page.evaluate(() => {
      window.__SET_GROUP_UNREAD_COUNT__('group-1', 3);
    });

    // Private tab should show badge
    await expect(page.locator('[data-testid="private-tab"] .icon-badge'))
      .toHaveText('5');

    // Group tab should show badge
    await expect(page.locator('[data-testid="group-tab"] .icon-badge'))
      .toHaveText('3');
  });

  test('should increment badge when new message arrives', async ({ page }) => {
    await page.goto('/conversations');

    // Initial count
    await page.evaluate(() => {
      window.__SET_UNREAD_COUNT__('conv-1', 2);
    });

    await expect(page.locator('[data-testid="conversations-nav-icon"] .icon-badge'))
      .toHaveText('2');

    // Simulate new message
    await page.evaluate(() => {
      window.__INCREMENT_UNREAD__('conv-1');
    });

    // Badge should increment
    await expect(page.locator('[data-testid="conversations-nav-icon"] .icon-badge'))
      .toHaveText('3');
  });

  test('should not increment badge when viewing the active conversation', async ({ page }) => {
    // Open conversation first
    await page.goto('/conversations/conv-1');

    // Set initial unread count
    await page.evaluate(() => {
      window.__SET_UNREAD_COUNT__('conv-1', 0);
    });

    // Simulate message for current conversation
    await page.evaluate(() => {
      window.__INCREMENT_UNREAD__('conv-1');
    });

    // Badge should NOT appear
    await expect(page.locator('[data-testid="conversations-nav-icon"] .icon-badge'))
      .not.toBeVisible();
  });

  test('should sum unread counts across all conversations', async ({ page }) => {
    await page.goto('/conversations');

    // Set multiple conversation unreads
    await page.evaluate(() => {
      window.__SET_UNREAD_COUNT__('conv-1', 5);
      window.__SET_UNREAD_COUNT__('conv-2', 3);
      window.__SET_UNREAD_COUNT__('conv-3', 2);
    });

    // Total should be 10
    await expect(page.locator('[data-testid="conversations-nav-icon"] .icon-badge'))
      .toHaveText('10');
  });

  test('should display badges correctly in different count ranges', async ({ page }) => {
    await page.goto('/conversations');

    const testCases = [
      { count: 1, expected: '1' },
      { count: 9, expected: '9' },
      { count: 10, expected: '10' },
      { count: 99, expected: '99' },
      { count: 100, expected: '99+' },
    ];

    for (const { count, expected } of testCases) {
      await page.evaluate((c) => window.__SET_UNREAD_COUNT__('conv-1', c), count);
      await expect(page.locator('[data-testid="conversation-item-1"] .icon-badge'))
        .toHaveText(expected);
    }
  });

  test('should handle badge positioning correctly', async ({ page }) => {
    await page.goto('/conversations');

    // Set unread count
    await page.evaluate(() => {
      window.__SET_UNREAD_COUNT__('conv-1', 5);
    });

    // Check badge is positioned correctly (not off-screen)
    const badge = page.locator('[data-testid="conversation-item-1"] .icon-badge');
    await expect(badge).toBeVisible();

    // Verify badge is within viewport bounds
    const box = await badge.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.x).toBeGreaterThan(0);
    expect(box!.y).toBeGreaterThan(0);
  });
});

test.describe('Unread Badges - Real-time Updates', () => {
  test('should update badges in real-time when messages arrive', async ({ browser }) => {
    // User A's context
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await loginAsUser(pageA, 'userA');
    await pageA.goto('/conversations');

    // User B's context
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await loginAsUser(pageB, 'userB');
    await pageB.goto('/conversations');

    // User A opens conversation 2
    await pageA.locator('[data-testid="conversation-item-2"]').click();

    // User B sends message to conversation 1
    await pageB.evaluate(() => {
      window.__SIMULATE_MESSAGE__('conv-1', 'Hello from B');
    });

    // User A's badge should increment (for conversation 1)
    await waitForBadgeUpdate(pageA, '1');
  });

  test('should sync badge clear across multiple tabs', async ({ browser, context }) => {
    // Create two tabs for same user
    const tab1 = await context.newPage();
    const tab2 = await context.newPage();

    await loginAsUser(tab1, 'userA');
    await loginAsUser(tab2, 'userA');

    await tab1.goto('/conversations');
    await tab2.goto('/conversations');

    // Set unread count
    await tab1.evaluate(() => {
      window.__SET_UNREAD_COUNT__('conv-1', 5);
    });

    // Both tabs should show badge
    await expect(tab1.locator('[data-testid="conversations-nav-icon"] .icon-badge'))
      .toHaveText('5');
    await expect(tab2.locator('[data-testid="conversations-nav-icon"] .icon-badge'))
      .toHaveText('5');

    // Tab 1 opens conversation
    await tab1.locator('[data-testid="conversation-item-1"]').click();

    // Tab 2 badge should clear via WebSocket sync
    await expect(tab2.locator('[data-testid="conversations-nav-icon"] .icon-badge'))
      .not.toBeVisible();
  });
});

test.describe('Unread Badges - Edge Cases', () => {
  test('should handle rapid message bursts correctly', async ({ page }) => {
    await page.goto('/conversations');

    // Simulate 50 rapid messages
    await page.evaluate(() => {
      for (let i = 0; i < 50; i++) {
        window.__INCREMENT_UNREAD__('conv-1');
      }
    });

    // Badge should show correct count
    await expect(page.locator('[data-testid="conversations-nav-icon"] .icon-badge'))
      .toHaveText('50');
  });

  test('should handle zero unread correctly', async ({ page }) => {
    await page.goto('/conversations');

    // Set count to 0
    await page.evaluate(() => {
      window.__SET_UNREAD_COUNT__('conv-1', 0);
    });

    // Badge should not be visible
    await expect(page.locator('[data-testid="conversation-item-1"] .icon-badge'))
      .not.toBeVisible();
  });

  test('should handle negative values gracefully', async ({ page }) => {
    await page.goto('/conversations');

    // Try to set negative count (edge case)
    await page.evaluate(() => {
      window.__SET_UNREAD_COUNT__('conv-1', -1);
    });

    // Badge should not be visible for negative values
    await expect(page.locator('[data-testid="conversation-item-1"] .icon-badge'))
      .not.toBeVisible();
  });
});

test.describe('Unread Badges - Performance', () => {
  test('should render badges efficiently with many conversations', async ({ page }) => {
    await page.goto('/conversations');

    // Create 100 conversations with varying unread counts
    await page.evaluate(() => {
      for (let i = 0; i < 100; i++) {
        window.__SET_CONVERSATION__(`conv-${i}`, {
          id: `conv-${i}`,
          unreadCount: Math.floor(Math.random() * 10)
        });
      }
    });

    const startTime = Date.now();
    await page.reload();
    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);

    // Badges should be visible
    await expect(page.locator('[data-testid="conversations-nav-icon"] .icon-badge'))
      .toBeVisible();
  });
});
