# Android API 36 (Google Play target)

## Change (2026-07-29)

Google Play requires targeting Android 16 (**API level 36**). MEDVBA previously used API **35**.

Updated in `app.config.ts` via `expo-build-properties`:

| Property | Value |
|----------|-------|
| `compileSdkVersion` | **36** |
| `targetSdkVersion` | **36** |
| `buildToolsVersion` | `36.0.0` |
| `android.versionCode` | **41** (was 40) |

iOS is unchanged aside from `ios.buildNumber` **65** for the next TestFlight upload.

## Build for Play (API 36)

```powershell
cd C:\Users\octav\Desktop\MEDVBA3\medvba-android
eas build --platform android --profile production
# or internal testing:
eas build --platform android --profile internal
eas submit --platform android --profile internal --latest
```

Upload `mapping.txt` from EAS Artifacts for the same `versionCode` (see `ANDROID_OBFUSCATION_MAPPING.md`).
