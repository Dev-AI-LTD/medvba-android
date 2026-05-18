#!/usr/bin/env node
/**
 * EAS Build runs this before `bun install`. Stray npm/yarn lockfiles in the upload
 * tarball (often gitignored locally) make `npx expo-doctor` fail with exit 1.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const strayLocks = ["package-lock.json", "yarn.lock", "pnpm-lock.yaml"];

for (const name of strayLocks) {
  const filePath = path.join(root, name);
  if (!fs.existsSync(filePath)) continue;
  fs.unlinkSync(filePath);
  console.log(`[eas-preinstall] Removed stray ${name} (project uses bun.lock only).`);
}

if (!fs.existsSync(path.join(root, "bun.lock"))) {
  console.error(
    "[eas-preinstall] Missing bun.lock — commit it and ensure it is not listed in .easignore.",
  );
  process.exit(1);
}
