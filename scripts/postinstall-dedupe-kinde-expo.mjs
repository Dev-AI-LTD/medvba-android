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
