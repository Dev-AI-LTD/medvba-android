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
  // Metro may enumerate/watch these paths; keep an empty dir even when install never nested deps here.
  fs.mkdirSync(dir, { recursive: true });
}

const kindeJsUtils = path.join(root, "node_modules", "@kinde", "js-utils", "dist", "js-utils.js");
if (fs.existsSync(kindeJsUtils)) {
  const source = fs.readFileSync(kindeJsUtils, "utf8");
  const before = `  default: async () => (await import(
    /* webpackIgnore: true */
    "./expoSecureStore-D7t_Z1p2.js"
  )).ExpoSecureStore`;
  const after = `  default: async () => {
    const mod = await import(
      /* webpackIgnore: true */
      "./expoSecureStore-D7t_Z1p2.js"
    );
    return mod.ExpoSecureStore ?? mod.default?.ExpoSecureStore ?? mod.default?.default?.ExpoSecureStore;
  }`;
  if (source.includes(before)) {
    fs.writeFileSync(kindeJsUtils, source.replace(before, after));
    console.log("[postinstall] Patched @kinde/js-utils ExpoSecureStore import for Metro.");
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
\t\tconst t = await e.default();
\t\tif (t) return t;
\t} catch (e) {
\t\tconsole.warn("[Kinde] Falling back to native Expo SecureStore:", e);
\t}
\treturn __KindeNativeSecureStore;
}`;
  if (!source.includes("__KindeNativeSecureStore")) {
    source = source.replace(marker, fallback);
  }
  source = source.replace("let t = new (await (e.default()))();", "let t = new (await __getKindeSecureStoreCtor())();");
  fs.writeFileSync(kindeExpoIndex, source);
  console.log("[postinstall] Patched @kinde/expo SecureStore fallback for Metro.");
}
