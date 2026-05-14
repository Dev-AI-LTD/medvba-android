/**
 * Detox E2E: login (optional) → tab Profile → Settings → back.
 *
 * Setup:
 * 1. npx expo prebuild --platform android
 * 2. Start emulator OR connect device (adb devices)
 * 3. Optional: set DETOX_AVD_NAME if auto-detect fails (emulator -list-avds)
 * 4. If the app opens on login: complete sign-in once manually (Continue with email or Google), or start from a
 *    signed-in device. In-app email/password fields were removed; DETOX_TEST_EMAIL / DETOX_TEST_PASSWORD are no longer used here.
 * 5. SDK: with-android-sdk setează ANDROID_* și PATH. Liste AVD: npm run e2e:list-avds
 *    DETOX_AVD_NAME trebuie să fie EXACT un nume din listă (nu textul din tutorial „ExactNameFromListAvds”).
 *    Fără AVD: telefon USB + „adb devices”, apoi npm run e2e:test:android:device
 * 6. Terminal A: npx expo start  (Metro 8081)
 * 7. Terminal B: npm run e2e:android (sau build + test separat)
 */

const DEFAULT_HOME_LABEL = 'Home';

describe('Login → Home → Settings → back', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('completes navigation flow', async () => {
    let onLogin = false;
    try {
      await waitFor(element(by.id('loginHostedEmail')))
        .toBeVisible()
        .withTimeout(8000);
      onLogin = true;
    } catch {
      onLogin = false;
    }

    if (onLogin) {
      throw new Error(
        'Login screen is visible: sign in once manually (Continue with email or Google), then re-run this test. Hosted auth cannot be filled from Detox.',
      );
    }

    await waitFor(element(by.label(DEFAULT_HOME_LABEL)))
      .toBeVisible()
      .withTimeout(120000);

    await element(by.label('Profile')).atIndex(0).tap();

    await waitFor(element(by.id('profileOpenSettings')))
      .toBeVisible()
      .withTimeout(15000);
    await element(by.id('profileOpenSettings')).tap();

    await waitFor(element(by.id('settingsScreen')))
      .toBeVisible()
      .withTimeout(15000);

    await element(by.id('settingsBack')).tap();

    await waitFor(element(by.id('profileOpenSettings')))
      .toBeVisible()
      .withTimeout(15000);
  });
});
