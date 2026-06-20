# Capture a real paywall screenshot (TestFlight / device)

Use this when replacing the framed marketing capture with a fresh in-app paywall shot.

## Steps

1. Install **TestFlight** build (not Expo Go — RevenueCat paywall needs a native build).
2. Sign in with the **free/expired** review account (`boctavian2014@gmail.com`) via **Sign in with email**.
3. Open paywall:
   - **Settings → Upgrade / Premium**, or
   - Hit a free-tier limit (quiz) until paywall appears, or
   - Navigate to `/paywall` if exposed in your test build.
4. Wait for RevenueCat paywall to load (monthly + yearly visible, Restore link visible).
5. Take screenshot on iPhone (Side + Volume Up).
6. Replace source file used in [`scripts/generate-app-store-screenshots.py`](../../scripts/generate-app-store-screenshots.py) (slide **Premium subscription**) or upload the raw PNG directly to ASC if you skip the marketing frame.

## Regenerate framed 6.5" set

```bash
cd medvba-android
python scripts/generate-app-store-screenshots.py
```

Upload `docs/app-store-screenshots/ios-6.5/*.png` in numeric order — **02** must stay the paywall slide.
