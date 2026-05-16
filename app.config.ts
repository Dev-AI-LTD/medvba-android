import type { ExpoConfig, ConfigContext } from 'expo/config';
import fs from 'fs';
import path from 'path';

type EnvMap = Record<string, string>;

/** Keep in sync with store releases; bare workflow requires a string runtimeVersion (no policy). */
const APP_VERSION = '1.0.27';

const readEnvText = (filePath: string): string => {
  const buf = fs.readFileSync(filePath);
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    return buf.slice(2).toString('utf16le');
  }
  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
    return buf.slice(2).toString('utf16le');
  }
  return buf.toString('utf8');
};

const loadEnvFile = (filePath: string, target: EnvMap, options?: { override?: boolean }) => {
  if (!fs.existsSync(filePath)) return;
  const raw = readEnvText(filePath);

  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) return;

    let key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key.charAt(0) === '\ufeff') {
      key = key.slice(1);
    }

    // Skip empty values so a blank line does not block later files / app.config fallbacks.
    if (value.trim() === '') {
      return;
    }

    if (options?.override) {
      target[key] = value;
      process.env[key] = value;
      return;
    }

    if (!target[key]) {
      target[key] = value;
    }
    if (process.env[key] === undefined || process.env[key] === '') {
      process.env[key] = value;
    }
  });
};

export default ({ config, projectRoot }: ConfigContext): ExpoConfig => {
  const root = projectRoot || process.cwd();
  const envFromFile: EnvMap = {};
  loadEnvFile(path.join(root, '.env'), envFromFile);
  loadEnvFile(path.join(root, '.env.local'), envFromFile, { override: true });

  /** Trebuie să coincidă cu URL-ul backend-ului unde rulează Hono (login email → POST /api/auth/session). */
  const mergedPublicApiBase =
    [envFromFile.EXPO_PUBLIC_API_BASE_URL, envFromFile.EXPO_PUBLIC_RORK_API_BASE_URL]
      .map((s) => (s || '').trim())
      .find(Boolean) ||
    [process.env.EXPO_PUBLIC_API_BASE_URL, process.env.EXPO_PUBLIC_RORK_API_BASE_URL]
      .map((s) => (s || '').trim())
      .find(Boolean);

  const plugins: NonNullable<ExpoConfig['plugins']> = [
    [
      'expo-router',
      {
        origin: 'https://medvba.app/',
      },
    ],
    [
      'expo-font',
      {
        fonts: [
          './node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf',
        ],
      },
    ],
    'expo-web-browser',
    [
      'expo-image-picker',
      {
        photosPermission:
          'MEDVBA accesses your photo library so you can choose or update your profile picture.',
      },
    ],
    // react-native-edge-to-edge: prevents react-native-screens from using deprecated setStatusBarColor/setNavigationBarColor APIs
    'react-native-edge-to-edge',
    'expo-notifications',
    [
      'expo-build-properties',
      {
        android: {
          // Play / Expo default floor: API 24 — wide device coverage; raise to 26+ if you drop older devices.
          minSdkVersion: 24,
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          buildToolsVersion: '35.0.0',
          // Google Play: R8 → mapping.txt (upload in Play Console → App bundle explorer → version → Deobfuscation file).
          enableMinifyInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
          // Keep classes that use deprecated Window status/nav bar APIs (RN, react-native-screens) so R8 doesn't break them; we use edgeToEdgeEnabled and lint DiscouragedApi is disabled.
          extraProguardRules: [
            '-keep class com.facebook.react.modules.statusbar.** { *; }',
            '-keep class com.swmansion.rnscreens.** { *; }',
            // Readable Java/Kotlin stack traces after deobfuscation (Play + crash tools).
            '-keepattributes SourceFile,LineNumberTable',
          ].join('\n'),
        },
      },
    ],
    './plugins/withAndroidLintSuppress.js',
    './plugins/withAndroidNativeDebugSymbols.js',
  ];

  return {
    ...config,
    name: 'MEDVBA',
    slug: 'medvba',
    version: APP_VERSION,
    orientation: 'default',
    icon: './assets/images/icon.png',
    scheme: 'medvba',
    userInterfaceStyle: 'dark',
    newArchEnabled: true,
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      /** Same family as `constants/colors` dark `background` — continuous with welcome / login. */
      backgroundColor: '#0A1628',
    },
    updates: {
      url: 'https://u.expo.dev/667a66db-a3be-4c1e-b7da-8ad212c92bb4',
    },
    runtimeVersion: APP_VERSION,
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.devaieood.medvba',
      icon: './assets/images/icon.png',
      buildNumber: '46',
      // Required for @invertase/react-native-apple-authentication (EAS / prebuild).
      entitlements: {
        'com.apple.developer.applesignin': ['Default'],
      },
      infoPlist: {
        NSPhotoLibraryUsageDescription:
          'MEDVBA accesses your photo library so you can choose or update your profile picture.',
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#000000',
      },
      versionCode: 36,
      package: 'com.devaieood.medvba',
      // Play: upload mapping.txt per release (Deobfuscation). Native: native-debug-symbols.zip (Symbols); both are buildArtifactPaths in eas.json.
      blockedPermissions: [
        'android.permission.CAMERA',
        'android.permission.RECORD_AUDIO',
        // Strip AAID permission so Play Console „Advertising ID” can match „not used for ads”
        // (Facebook plugin already has advertiserIDCollectionEnabled: false).
        'com.google.android.gms.permission.AD_ID',
      ],
      permissions: [
        'android.permission.VIBRATE',
        'android.permission.POST_NOTIFICATIONS',
      ],
      // Android 15+ edge-to-edge; use system bars (status/nav) via insets instead of deprecated color APIs
      edgeToEdgeEnabled: true,
    },
    web: {
      favicon: './assets/images/favicon.png',
    },
    plugins,
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {
        origin: 'https://medvba.app/',
      },
      eas: {
        projectId: '667a66db-a3be-4c1e-b7da-8ad212c92bb4',
      },
      EXPO_PUBLIC_SUPABASE_URL:
        envFromFile.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY:
        envFromFile.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      EXPO_PUBLIC_API_BASE_URL:
        mergedPublicApiBase ||
        envFromFile.EXPO_PUBLIC_API_BASE_URL ||
        process.env.EXPO_PUBLIC_API_BASE_URL,
      EXPO_PUBLIC_RORK_API_BASE_URL:
        mergedPublicApiBase ||
        envFromFile.EXPO_PUBLIC_RORK_API_BASE_URL ||
        process.env.EXPO_PUBLIC_RORK_API_BASE_URL,
      EXPO_PUBLIC_REVENUECAT_API_KEY_IOS:
        envFromFile.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS,
      EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID:
        envFromFile.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID || process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID,
      // Local / USB dev: default on so limits + paywall can be tested without forgetting .env.
      // EAS cloud & local EAS builds set EAS_BUILD=true → default off unless secret / .env sets true.
      EXPO_PUBLIC_PAYWALL_ENABLED:
        envFromFile.EXPO_PUBLIC_PAYWALL_ENABLED ??
        process.env.EXPO_PUBLIC_PAYWALL_ENABLED ??
        (process.env.EAS_BUILD === 'true' ? 'false' : 'true'),
      EXPO_PUBLIC_KINDE_ISSUER_URL:
        envFromFile.EXPO_PUBLIC_KINDE_ISSUER_URL || process.env.EXPO_PUBLIC_KINDE_ISSUER_URL,
      EXPO_PUBLIC_KINDE_CLIENT_ID:
        envFromFile.EXPO_PUBLIC_KINDE_CLIENT_ID || process.env.EXPO_PUBLIC_KINDE_CLIENT_ID,
      EXPO_PUBLIC_KINDE_GOOGLE_CONNECTION_ID:
        envFromFile.EXPO_PUBLIC_KINDE_GOOGLE_CONNECTION_ID ||
        process.env.EXPO_PUBLIC_KINDE_GOOGLE_CONNECTION_ID,
      EXPO_PUBLIC_KINDE_FACEBOOK_CONNECTION_ID:
        envFromFile.EXPO_PUBLIC_KINDE_FACEBOOK_CONNECTION_ID ||
        process.env.EXPO_PUBLIC_KINDE_FACEBOOK_CONNECTION_ID,
      EXPO_PUBLIC_KINDE_EMAIL_CONNECTION_ID:
        envFromFile.EXPO_PUBLIC_KINDE_EMAIL_CONNECTION_ID ||
        process.env.EXPO_PUBLIC_KINDE_EMAIL_CONNECTION_ID,
      EXPO_PUBLIC_KINDE_APPLE_CONNECTION_ID:
        envFromFile.EXPO_PUBLIC_KINDE_APPLE_CONNECTION_ID ||
        process.env.EXPO_PUBLIC_KINDE_APPLE_CONNECTION_ID,
      EXPO_PUBLIC_KINDE_SCOPES:
        envFromFile.EXPO_PUBLIC_KINDE_SCOPES || process.env.EXPO_PUBLIC_KINDE_SCOPES,
      EXPO_PUBLIC_SHOW_FACEBOOK_LOGIN:
        envFromFile.EXPO_PUBLIC_SHOW_FACEBOOK_LOGIN || process.env.EXPO_PUBLIC_SHOW_FACEBOOK_LOGIN,
      EXPO_PUBLIC_FACEBOOK_LOGIN_ENABLED:
        envFromFile.EXPO_PUBLIC_FACEBOOK_LOGIN_ENABLED || process.env.EXPO_PUBLIC_FACEBOOK_LOGIN_ENABLED,
      EXPO_PUBLIC_FETCH_ZOOM_REQUESTS:
        envFromFile.EXPO_PUBLIC_FETCH_ZOOM_REQUESTS ??
        process.env.EXPO_PUBLIC_FETCH_ZOOM_REQUESTS ??
        'false',
      EXPO_PUBLIC_SUPPORT_EMAIL:
        envFromFile.EXPO_PUBLIC_SUPPORT_EMAIL || process.env.EXPO_PUBLIC_SUPPORT_EMAIL,
    },
    owner: 'devaieood79',
  };
};
