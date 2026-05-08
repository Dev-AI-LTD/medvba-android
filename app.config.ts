import type { ExpoConfig, ConfigContext } from 'expo/config';
import fs from 'fs';
import path from 'path';

type EnvMap = Record<string, string>;

/** Keep in sync with store releases; bare workflow requires a string runtimeVersion (no policy). */
const APP_VERSION = '1.0.20';

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

const loadEnvFile = (filePath: string, target: EnvMap) => {
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
  loadEnvFile(path.join(root, '.env.local'), envFromFile);

  const plugins: NonNullable<ExpoConfig['plugins']> = [
    [
      'expo-router',
      {
        origin: 'https://medvba.app/',
      },
    ],
    'expo-font',
    'expo-web-browser',
    [
      'expo-image-picker',
      {
        photosPermission:
          'The app accesses your photos to let you share them with your friends.',
      },
    ],
    // react-native-edge-to-edge: prevents react-native-screens from using deprecated setStatusBarColor/setNavigationBarColor APIs
    'react-native-edge-to-edge',
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
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    updates: {
      url: 'https://u.expo.dev/667a66db-a3be-4c1e-b7da-8ad212c92bb4',
    },
    runtimeVersion: APP_VERSION,
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.devaieood.medvba',
      icon: './assets/images/icon.png',
      buildNumber: '39',
      // Required for Apple Sign-In via Cognito Hosted UI (App Store compliance).
      entitlements: {
        'com.apple.developer.applesignin': ['Default'],
      },
      infoPlist: {
        NSPhotoLibraryUsageDescription: 'Allow $(PRODUCT_NAME) to access your photos',
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#000000',
      },
      versionCode: 29,
      package: 'com.devaieood.medvba',
      // Play: upload mapping.txt per release (Deobfuscation). Native: native-debug-symbols.zip (Symbols); both are buildArtifactPaths in eas.json.
      blockedPermissions: [
        'android.permission.CAMERA',
        'android.permission.RECORD_AUDIO',
        'com.google.android.gms.permission.AD_ID',
      ],
      permissions: [
        'android.permission.VIBRATE',
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
        envFromFile.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_BASE_URL,
      EXPO_PUBLIC_REVENUECAT_API_KEY_IOS:
        envFromFile.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS,
      EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID:
        envFromFile.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID || process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID,
      EXPO_PUBLIC_PAYWALL_ENABLED:
        envFromFile.EXPO_PUBLIC_PAYWALL_ENABLED ?? process.env.EXPO_PUBLIC_PAYWALL_ENABLED ?? 'false',
      EXPO_PUBLIC_COGNITO_REGION:
        envFromFile.EXPO_PUBLIC_COGNITO_REGION || process.env.EXPO_PUBLIC_COGNITO_REGION,
      EXPO_PUBLIC_COGNITO_USER_POOL_ID:
        envFromFile.EXPO_PUBLIC_COGNITO_USER_POOL_ID || process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID,
      EXPO_PUBLIC_COGNITO_APP_CLIENT_ID:
        envFromFile.EXPO_PUBLIC_COGNITO_APP_CLIENT_ID || process.env.EXPO_PUBLIC_COGNITO_APP_CLIENT_ID,
      EXPO_PUBLIC_COGNITO_DOMAIN:
        envFromFile.EXPO_PUBLIC_COGNITO_DOMAIN || process.env.EXPO_PUBLIC_COGNITO_DOMAIN,
    },
    owner: 'devaieood79',
  };
};
