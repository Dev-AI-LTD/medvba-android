/**
 * @kinde/expo@0.5.3 ships nested expo-* (SDK ~51) while this app uses Expo SDK 54.
 * Bun/npm keep those copies under node_modules/@kinde/expo/node_modules, which makes
 * expo-doctor fail duplicate-native-modules and can confuse autolinking.
 * Safe to remove: Node resolves peer deps from the project root.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const toRemove = [
  path.join(root, "node_modules", "@kinde", "expo", "node_modules"),
  // Same-version duplicate confuses expo-doctor; root expo-crypto is authoritative.
  path.join(root, "node_modules", "expo-auth-session", "node_modules"),
];

for (const dir of toRemove) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log("[postinstall] Removed:", path.relative(root, dir));
  }
  // Do not recreate empty `node_modules` here: on Windows Metro's watcher can still try to watch
  // stale nested paths (e.g. …/dotenv/…) and crash with ENOENT (see expo start exit 7).
}

const kindeJsUtils = path.join(root, "node_modules", "@kinde", "js-utils", "dist", "js-utils.js");
if (fs.existsSync(kindeJsUtils)) {
  let source = fs.readFileSync(kindeJsUtils, "utf8");
  /** Original upstream (dynamic import). */
  const beforeDynamic = `  default: async () => (await import(
    /* webpackIgnore: true */
    "./expoSecureStore-D7t_Z1p2.js"
  )).ExpoSecureStore`;
  /** Our older Metro patch — Hermes release compile rejects \`yield import()\` from this shape. */
  const beforeAwaitImport = `  default: async () => {
    const mod = await import(
      /* webpackIgnore: true */
      "./expoSecureStore-D7t_Z1p2.js"
    );
    return mod.ExpoSecureStore ?? mod.default?.ExpoSecureStore ?? mod.default?.default?.ExpoSecureStore;
  }`;
  /** Metro + Hermes: synchronous require of the CJS chunk (no dynamic import in async). */
  const afterRequire = `  default: async () => {
    const mod = require("./expoSecureStore-D7t_Z1p2.js");
    return mod.ExpoSecureStore ?? mod.default?.ExpoSecureStore ?? mod.default?.default?.ExpoSecureStore;
  }`;
  if (source.includes(beforeAwaitImport)) {
    source = source.replace(beforeAwaitImport, afterRequire);
    fs.writeFileSync(kindeJsUtils, source);
    console.log("[postinstall] Patched @kinde/js-utils ExpoSecureStore → require() for Hermes release bundle.");
  } else if (source.includes(beforeDynamic)) {
    fs.writeFileSync(kindeJsUtils, source.replace(beforeDynamic, afterRequire));
    console.log("[postinstall] Patched @kinde/js-utils ExpoSecureStore import for Metro/Hermes.");
  }
}

const kindeExpoIndex = path.join(root, "node_modules", "@kinde", "expo", "dist", "index.mjs");
if (fs.existsSync(kindeExpoIndex)) {
  let source = fs.readFileSync(kindeExpoIndex, "utf8");
  const importBefore =
    'import { ExpoSecureStore as e, PortalPage as t, PromptTypes as n, StorageKeys as r, generatePortalUrl as i, getUserProfile as a, mapLoginMethodParamsForUrl as o, refreshToken as s, setActiveStorage as c, setRefreshTimer as l } from "@kinde/js-utils";';
  const importAfter =
    'import { ExpoSecureStore as e, PortalPage as t, PromptTypes as n, StorageKeys as r, generatePortalUrl as i, getUserProfile as a, mapLoginMethodParamsForUrl as o, refreshToken as s, setActiveStorage as c, setRefreshTimer as l, splitString as __kindeSplitString, storageSettings as __kindeStorageSettings } from "@kinde/js-utils";\nimport * as __KindeSecureStoreModule from "expo-secure-store";';
  if (source.includes(importBefore)) {
    source = source.replace(importBefore, importAfter);
  }

  const marker = 'typeof window < "u" && (window.btoa = O.encode, window.atob = O.decode);';
  const fallback = `${marker}
class __KindeNativeSecureStore {
\tasyncStore = true;
\tlisteners = new Set();
\tnotificationScheduled = false;
\tnotifyListeners() { this.listeners.size !== 0 && this.scheduleNotification(); }
\tasync scheduleNotification() {
\t\tif (this.notificationScheduled) return;
\t\tthis.notificationScheduled = true;
\t\tawait new Promise((e) => {
\t\t\tsetTimeout(async () => {
\t\t\t\tawait Promise.all(Array.from(this.listeners).map((e) => e()));
\t\t\t\tthis.notificationScheduled = false;
\t\t\t\te();
\t\t\t}, 0);
\t\t});
\t}
\tsubscribe(e) { this.listeners.add(e); return () => this.listeners.delete(e); }
\tasync setItems(e) { await Promise.all(Object.entries(e).map(([t, n]) => this.setSessionItem(t, n))); }
\tasync getItems(...e) {
\t\tconst t = e.map(async (e) => [e, await this.getSessionItem(e)]);
\t\treturn Object.fromEntries(await Promise.all(t));
\t}
\tasync removeItems(...e) { await Promise.all(e.map((e) => this.removeSessionItem(e))); }
\tasync destroySession() {
\t\tawait this.removeItems(r.accessToken, r.idToken, r.refreshToken, r.state, r.nonce, r.codeVerifier);
\t\tthis.notifyListeners();
\t}
\tasync setSessionItem(e, t) {
\t\tawait this.removeSessionItem(e);
\t\tif (typeof t !== "string") throw new Error("Item value must be a string");
\t\tconst n = __kindeSplitString(t, Math.min(__kindeStorageSettings.maxLength, 2048));
\t\tawait Promise.all(n.map((t, n) => __KindeSecureStoreModule.setItemAsync(\`\${__kindeStorageSettings.keyPrefix}\${e}\${n}\`, t)));
\t\tthis.notifyListeners();
\t}
\tasync getSessionItem(e) {
\t\tconst t = [];
\t\tlet n = 0, r = await __KindeSecureStoreModule.getItemAsync(\`\${__kindeStorageSettings.keyPrefix}\${String(e)}\${n}\`);
\t\tfor (; r; ) {
\t\t\tt.push(r);
\t\t\tn++;
\t\t\tr = await __KindeSecureStoreModule.getItemAsync(\`\${__kindeStorageSettings.keyPrefix}\${String(e)}\${n}\`);
\t\t}
\t\treturn t.join("") || null;
\t}
\tasync removeSessionItem(e) {
\t\tlet t = 0, n = await __KindeSecureStoreModule.getItemAsync(\`\${__kindeStorageSettings.keyPrefix}\${String(e)}\${t}\`);
\t\tfor (; n; ) {
\t\t\tawait __KindeSecureStoreModule.deleteItemAsync(\`\${__kindeStorageSettings.keyPrefix}\${String(e)}\${t}\`);
\t\t\tt++;
\t\t\tn = await __KindeSecureStoreModule.getItemAsync(\`\${__kindeStorageSettings.keyPrefix}\${String(e)}\${t}\`);
\t\t}
\t\tthis.notifyListeners();
\t}
}
async function __getKindeSecureStoreCtor() {
\ttry {
\t\tconst Ctor = await e.default();
\t\tif (Ctor && typeof Ctor.prototype.removeItems === "function") return Ctor;
\t} catch (err) {
\t\tconsole.warn("[Kinde] Falling back to native Expo SecureStore:", err);
\t}
\treturn __KindeNativeSecureStore;
}`;
  if (!source.includes("__KindeNativeSecureStore")) {
    source = source.replace(marker, fallback);
  }
  const ctorOldBody = `\t\tconst t = await e.default();
\t\tif (t) return t;`;
  const ctorNewBody = `\t\tconst Ctor = await e.default();
\t\tif (Ctor && typeof Ctor.prototype.removeItems === "function") return Ctor;`;
  if (source.includes(ctorOldBody)) {
    source = source.replace(ctorOldBody, ctorNewBody);
  }
  source = source.replace("let t = new (await (e.default()))();", "let t = new (await __getKindeSecureStoreCtor())();");
  fs.writeFileSync(kindeExpoIndex, source);
  console.log("[postinstall] Patched @kinde/expo SecureStore fallback for Metro.");
}

/** @expo/vector-icons: Font.loadAsync can reject (empty asset URI, Metro hiccup) → uncaught promise / LogBox. */
const vectorIconsCreateIconSet = path.join(
  root,
  "node_modules",
  "@expo",
  "vector-icons",
  "build",
  "createIconSet.js",
);
if (fs.existsSync(vectorIconsCreateIconSet)) {
  const original = fs.readFileSync(vectorIconsCreateIconSet, "utf8");
  let s = original;
  const marker = "__MEDVBA_PATCH_VECTOR_ICONS_FONT_CATCH__";
  if (!s.includes(marker)) {
    const didMountBefore = `        async componentDidMount() {
            this._mounted = true;
            if (!this.state.fontIsLoaded) {
                await Font.loadAsync(font);
                /* eslint-disable react/no-did-mount-set-state */
                this._mounted && this.setState({ fontIsLoaded: true });
            }
        }`;
    const didMountAfter = `        async componentDidMount() {
            this._mounted = true;
            if (!this.state.fontIsLoaded) {
                try {
                    await Font.loadAsync(font);
                } catch (e) {
                    if (typeof __DEV__ !== "undefined" && __DEV__) {
                        console.warn("${marker}:", e);
                    }
                }
                /* eslint-disable react/no-did-mount-set-state */
                this._mounted && this.setState({ fontIsLoaded: true });
            }
        }`;
    if (s.includes(didMountBefore)) {
      s = s.replace(didMountBefore, didMountAfter);
    }
    const loadFontBefore = `        static loadFont = () => Font.loadAsync(font);`;
    const loadFontAfter = `        static loadFont = () => Font.loadAsync(font).catch((e) => {
            if (typeof __DEV__ !== "undefined" && __DEV__) {
                console.warn("${marker} loadFont:", e);
            }
        });`;
    if (s.includes(loadFontBefore)) {
      s = s.replace(loadFontBefore, loadFontAfter);
    }
    const getImageBefore = `            await Font.loadAsync(font);
            const renderToImageResult = await Font.renderToImageAsync(String.fromCodePoint(glyphMap[name]), {`;
    const getImageAfter = `            try {
                await Font.loadAsync(font);
            } catch (e) {
                if (typeof __DEV__ !== "undefined" && __DEV__) {
                    console.warn("${marker} getImageSource:", e);
                }
                return null;
            }
            const renderToImageResult = await Font.renderToImageAsync(String.fromCodePoint(glyphMap[name]), {`;
    if (s.includes(getImageBefore)) {
      s = s.replace(getImageBefore, getImageAfter);
    }
    if (s !== original) {
      fs.writeFileSync(vectorIconsCreateIconSet, s);
      console.log("[postinstall] Patched @expo/vector-icons createIconSet.js (font load errors are non-fatal).");
    }
  }
}

/**
 * Patch `node_modules/.bin/expo-doctor*` so `npx expo-doctor` / `npx -y expo-doctor` from repo root
 * always runs Kinde dedupe first, then the pinned `expo-doctor` package (matches `bun run doctor`).
 */
function patchExpoDoctorBinShims() {
  const doctorMain = path.join(root, "node_modules", "expo-doctor", "build", "index.js");
  const binDir = path.join(root, "node_modules", ".bin");
  if (!fs.existsSync(doctorMain) || !fs.existsSync(binDir)) {
    return;
  }

  const shPath = path.join(binDir, "expo-doctor");
  // On Linux/macOS, .bin/expo-doctor is often a symlink to ../expo-doctor/build/index.js.
  // Writing without unlink first corrupts the real package entry (EAS RUN_EXPO_DOCTOR SyntaxError).
  try {
    if (fs.existsSync(shPath)) {
      const stat = fs.lstatSync(shPath);
      if (stat.isSymbolicLink() || stat.isFile()) {
        fs.unlinkSync(shPath);
      }
    }
  } catch (_) {
    /* ignore */
  }

  const sh = `#!/bin/sh
# Generated by scripts/postinstall-dedupe-kinde-expo.mjs — do not edit by hand
ROOT=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd) || exit 1
exec node "$ROOT/scripts/expo-doctor-with-dedupe.mjs" "$@"
`;
  fs.writeFileSync(shPath, sh, "utf8");
  try {
    fs.chmodSync(shPath, 0o755);
  } catch (_) {
    // Windows or FS without chmod
  }

  const cmdPath = path.join(binDir, "expo-doctor.cmd");
  const cmd = `@echo off
setlocal
set "ROOT=%~dp0..\\.."
node "%ROOT%\\scripts\\expo-doctor-with-dedupe.mjs" %*
exit /b %ERRORLEVEL%
`;
  fs.writeFileSync(cmdPath, cmd, "utf8");

  const ps1Path = path.join(binDir, "expo-doctor.ps1");
  const ps1 = `#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..\\..")).Path
node (Join-Path $root "scripts\\expo-doctor-with-dedupe.mjs") @args
exit $LASTEXITCODE
`;
  try {
    fs.writeFileSync(ps1Path, ps1, "utf8");
  } catch (_) {
    /* ignore */
  }

  console.log("[postinstall] Patched node_modules/.bin/expo-doctor* → scripts/expo-doctor-with-dedupe.mjs");
}

patchExpoDoctorBinShims();
