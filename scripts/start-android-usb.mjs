/**
 * USB + Metro: forward device localhost:8081 → host (required for --localhost / 127.0.0.1 bundle URL).
 * Avoids shell `&&` quirks on Windows (PowerShell/cmd) so adb reverse failure is visible before Expo starts.
 */
import { spawn, spawnSync } from 'node:child_process';
import process from 'node:process';

const shell = process.platform === 'win32';

const adb = spawnSync('adb', ['reverse', 'tcp:8081', 'tcp:8081'], { stdio: 'inherit', shell });
if (adb.error) {
  console.error('[start-android-usb]', adb.error.message);
  process.exit(1);
}
if (adb.status !== 0) {
  console.error(
    '[start-android-usb] adb reverse failed (exit %s). Cable USB, depanare USB activă, apoi: adb devices',
    adb.status,
  );
  process.exit(adb.status ?? 1);
}

const child = spawn('bunx', ['expo', 'start', '--localhost', '--clear'], {
  stdio: 'inherit',
  shell,
  env: process.env,
});

child.on('exit', (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});
