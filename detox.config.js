/** @type {import('detox').Detox.DetoxConfig} */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getEmulatorExecutable() {
  const sdk = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME || '';
  if (!sdk) return null;
  const win = path.join(sdk, 'emulator', 'emulator.exe');
  const nix = path.join(sdk, 'emulator', 'emulator');
  if (fs.existsSync(win)) return win;
  if (fs.existsSync(nix)) return nix;
  return null;
}

function listAvdNames() {
  const emu = getEmulatorExecutable();
  if (!emu) {
    throw new Error(
      '[detox] Lipsește emulatorul din SDK. Android Studio: SDK Manager → SDK Tools → Android Emulator.'
    );
  }
  let out = '';
  try {
    out = execFileSync(emu, ['-list-avds'], { encoding: 'utf8' }).trim();
  } catch (e) {
    throw new Error(`[detox] Nu pot rula listarea AVD: ${emu} -list-avds — ${e.message}`);
  }
  return out
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function getAvdName() {
  const fromEnv = process.env.DETOX_AVD_NAME?.trim();
  const avds = listAvdNames();

  if (fromEnv) {
    if (!avds.includes(fromEnv)) {
      const hint = avds.length ? avds.join(', ') : '(nimic — rulează npm run e2e:list-avds)';
      throw new Error(
        `[detox] DETOX_AVD_NAME="${fromEnv}" nu se potrivește cu niciun AVD. Disponibile: ${hint}. Nu folosi textul din exemple (ex. "ExactNameFromListAvds") — pune numele real din listă.`
      );
    }
    console.info('[detox] Using AVD (din env):', fromEnv);
    return fromEnv;
  }

  if (avds.length === 0) {
    throw new Error(
      '[detox] Niciun AVD. Android Studio → Device Manager → Create Device, sau: npm run e2e:test:android:device cu telefon USB.'
    );
  }

  const first = avds[0];
  console.info('[detox] Using AVD:', first, avds.length > 1 ? `(altul: $env:DETOX_AVD_NAME="Nume")` : '');
  return first;
}

/** Lazy avdName: nu apela getAvdName() la require() (ex. config android.attached fără AVD). */
const androidEmulatorDevice = {};
Object.defineProperty(androidEmulatorDevice, 'avdName', {
  // Keep it non-enumerable so detox merge logic doesn't resolve it
  // when running with the attached-device configuration.
  enumerable: false,
  configurable: true,
  get() {
    return getAvdName();
  },
});

module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: `node ${path.join(__dirname, 'scripts', 'detox-android-build.js')}`,
      reversePorts: [8081],
    },
  },
  devices: {
    emulator: {
      type: 'android.emulator',
      device: androidEmulatorDevice,
    },
    attached: {
      type: 'android.attached',
      device: {
        /** Serial din `adb devices` sau regex, ex. DETOX_ADB_NAME=emulator-5554 */
        adbName: process.env.DETOX_ADB_NAME || '.*',
      },
    },
  },
  configurations: {
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
    'android.att.debug': {
      device: 'attached',
      app: 'android.debug',
    },
  },
};
