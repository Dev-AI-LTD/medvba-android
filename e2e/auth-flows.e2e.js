/**
 * Detox E2E: Auth flow smoke (login / signup shell)
 *
 * Login and sign-up use hosted email + social; in-app email/password fields were removed.
 * Deep credential and hosted-browser flows are not exercised in Detox here.
 */

describe('Auth Flow Tests', () => {
  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
  });

  describe('Login Screen', () => {
    it('shows hosted email and social entry points', async () => {
      await waitFor(element(by.id('loginHostedEmail')))
        .toBeVisible()
        .withTimeout(8000);

      await expect(element(by.label('Sign in with Google'))).toBeVisible();
    });

    it('navigates to forgot password', async () => {
      await waitFor(element(by.id('loginHostedEmail')))
        .toBeVisible()
        .withTimeout(8000);

      await element(by.text('Forgot Password?')).tap();

      await expect(element(by.text('Send reset instructions'))).toBeVisible();
    });
  });
});
