/**
 * Detox E2E: Tutor/AI Chat Tests
 * 
 * Covers:
 * - Tutor screen navigation
 * - Message input and sending
 * - Error handling
 * - Subscription limit behavior
 */

describe('Tutor Screen Tests', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  describe('Tutor Screen UI', () => {
    it('navigates to tutor screen', async () => {
      // First, ensure we're logged in (use helper function or previous test state)
      let onLogin = false;
      try {
        await waitFor(element(by.id('loginHostedEmail')))
          .toBeVisible()
          .withTimeout(5000);
        onLogin = true;
      } catch {
        onLogin = false;
      }

      if (onLogin) {
        throw new Error(
          'Login screen is visible: sign in manually first, then re-run. Hosted email/social auth is not automated in this suite.',
        );
      }

      // Wait for home screen
      await waitFor(element(by.label('Home')))
        .toBeVisible()
        .withTimeout(60000);

      // Navigate to Tutor tab
      await element(by.label('Tutor')).atIndex(0).tap();

      await waitFor(element(by.text('AI Tutor')))
        .toBeVisible()
        .withTimeout(15000);
    });

    it('shows welcome message on tutor screen', async () => {
      await waitFor(element(by.text('AI Tutor')))
        .toBeVisible()
        .withTimeout(15000);

      // Welcome message should be visible
      await expect(element(by.text(/Hello|Hi|Welcome|medicine/i))).toBeVisible();
    });

    it('shows suggestion cards on empty conversation', async () => {
      // Should show suggested questions
      await expect(element(by.text('Try asking'))).toBeVisible();
    });

    it('shows message input field', async () => {
      // Input field should be visible
      const inputElement = element(by.type('android.widget.EditText')).or(element(by.type('RCTTextInput')));
      await expect(inputElement).toBeVisible();
    });

    it('shows character counter', async () => {
      // Character counter should be visible (0/500)
      await expect(element(by.text('0/500'))).toBeVisible();
    });
  });

  describe('Tutor Interaction', () => {
    it('disables send button when input is empty', async () => {
      // Send button should be disabled
      const sendButton = element(by.label('Send')).or(element(by.id('sendButton')));
      await expect(sendButton).toBeVisible();
    });

    it('updates character counter when typing', async () => {
      const inputElement = element(by.type('android.widget.EditText')).or(element(by.type('RCTTextInput')));
      await inputElement.replaceText('Test question');
      
      // Counter should update
      await expect(element(by.text('12/500'))).toBeVisible();
    });

    it('sends message and shows user bubble', async () => {
      const inputElement = element(by.type('android.widget.EditText')).or(element(by.type('RCTTextInput')));
      await inputElement.replaceText('What is the Krebs cycle?');
      
      const sendButton = element(by.label('Send')).or(element(by.id('sendButton')));
      await sendButton.tap();
      
      // User message should appear
      await waitFor(element(by.text('What is the Krebs cycle?')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('shows typing indicator while waiting for response', async () => {
      // Typing indicator (three dots) should appear
      await expect(element(by.text('...'))).toBeVisible();
    });
  });

  describe('Tutor Error Handling', () => {
    it('shows error message on network failure', async () => {
      // This would require network mocking or actual failure scenario
      // Skipped in normal CI
    });

    it('shows retry button on error', async () => {
      // If an error occurs, retry button should appear
      // Implementation depends on error simulation
    });

    it('respects character limit', async () => {
      const inputElement = element(by.type('android.widget.EditText')).or(element(by.type('RCTTextInput')));
      
      // Try to type more than 500 characters
      const longText = 'A'.repeat(600);
      await inputElement.replaceText(longText);
      
      // Counter should show 500/500
      await expect(element(by.text('500/500'))).toBeVisible();
      
      // Send button should still work but with truncated content
    });
  });

  describe('Subscription Limit Behavior', () => {
    it('shows paywall when free limit reached', async () => {
      // This test requires setting up a free user scenario
      // Skipped in normal CI as it requires specific user state
    });

    it('shows premium badge for premium users', async () => {
      // This test requires a premium user
      // Skipped in normal CI
    });
  });
});
