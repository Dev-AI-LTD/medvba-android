#!/usr/bin/env node
/**
 * Runs EAS CLI via **npm's npx** (not Bun's package runner), so Windows avoids Bun cache EPERM
 * and we keep eas-cli out of package.json (expo-doctor requires that).
 *
 * Usage: node scripts/eas-build.mjs <profile> [extra eas args...]
 * Example: node scripts/eas-build.mjs development
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const profile = process.argv[2];
if (!profile) {
  console.error("Usage: node scripts/eas-build.mjs <eas-profile> [extra args passed to eas build]");
  process.exit(1);
}

const rest = process.argv.slice(3);
const args = [
  "-y",
  "eas-cli",
  "build",
  "--platform",
  "android",
  "--profile",
  profile,
  "--non-interactive",
  "--no-wait",
  ...rest,
];

/** Prefer npm's npx on Windows so we don't hit Bun's shim/cache. */
const isWin = process.platform === "win32";
const command = isWin ? "npx.cmd" : "npx";

const result = spawnSync(command, args, {
  cwd: root,
  stdio: "inherit",
  shell: isWin,
  env: process.env,
});

process.exit(result.status ?? 1);
