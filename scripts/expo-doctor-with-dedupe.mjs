#!/usr/bin/env node
/**
 * Runs Kinde dedupe then the pinned expo-doctor CLI. Used by node_modules/.bin shims so
 * `npx expo-doctor` / `npx -y expo-doctor` (from project root) match `bun run doctor`.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dedupe = path.join(root, "scripts", "postinstall-dedupe-kinde-expo.mjs");
const doctor = path.join(root, "node_modules", "expo-doctor", "build", "index.js");

const dedupeResult = spawnSync(process.execPath, [dedupe], {
  stdio: "inherit",
  cwd: root,
  env: process.env,
});
if (dedupeResult.status !== 0 && dedupeResult.status != null) {
  process.exit(dedupeResult.status);
}

if (!fs.existsSync(doctor)) {
  console.error(
    "[expo-doctor] Missing node_modules/expo-doctor. From repo root run: bun install",
  );
  process.exit(1);
}

const r = spawnSync(process.execPath, [doctor, ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: root,
  env: process.env,
});
process.exit(r.status === null ? 1 : r.status);
