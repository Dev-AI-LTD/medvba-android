/**
 * USB + Metro: forward device localhost:8081 → host (required for --localhost / 127.0.0.1 bundle URL).
 * Avoids shell `&&` quirks on Windows (PowerShell/cmd) so adb reverse failure is visible before Expo starts.
 */
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const shell = process.platform === 'win32';
/** Repo root (parent of `scripts/`) so Expo always loads `app.config.ts` + `.env` from this project. */
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const port of [8081, 8082, 8083]) {
  const adb = spawnSync('adb', ['reverse', `tcp:${port}`, `tcp:${port}`], { stdio: 'inherit', shell });
  if (adb.error) {
    console.error('[start-android-usb]', adb.error.message);
    process.exit(1);
  }
  if (adb.status !== 0) {
    console.error(
      '[start-android-usb] adb reverse tcp:%s failed (exit %s). USB + USB debugging on, then: adb devices',
      port,
      adb.status,
    );
    process.exit(adb.status ?? 1);
  }
}

const child = spawn('bunx', ['expo', 'start', '--localhost', '--port', '8081', '--clear'], {
  stdio: 'inherit',
  shell,
  cwd: projectRoot,
  env: process.env,
});

child.on('exit', (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});
