/**
 * Windows: Gradle under deep TEMP (e.g. Cursor sandbox) can exceed MAX_PATH and break CMake/Ninja.
 * Matches `android/gradlew.bat`: prefer `C:\.gradle`. Also stops Gradle daemons so a new home is picked up.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const extraArgs = process.argv.slice(2);

/** Bun + `shell: true` breaks Windows `.bat` (`@rem` → `em`). Use Node + cmd.exe instead. */
const nodeExe = process.execPath;
const isBunRuntime = path.basename(nodeExe).toLowerCase().includes('bun');

/** Same path as `android/gradlew.bat` (short, stable on Windows). */
const WIN_GRADLE_HOME = 'C:\\.gradle';
const WIN_GRADLE_TMP = path.join(WIN_GRADLE_HOME, 'tmp');

/** Override Cursor sandbox TEMP / GRADLE_USER_HOME (MAX_PATH CMake failures). */
function applyShortGradlePaths(targetEnv) {
  try {
    fs.mkdirSync(WIN_GRADLE_TMP, { recursive: true });
  } catch {
    /* best effort */
  }
  targetEnv.GRADLE_USER_HOME = WIN_GRADLE_HOME;
  targetEnv.TEMP = WIN_GRADLE_TMP;
  targetEnv.TMP = WIN_GRADLE_TMP;
  targetEnv.JAVA_TOOL_OPTIONS = '-Dgradle.user.home=C:/.gradle';
}

/**
 * Cursor sets GRADLE_USER_HOME to .../cursor-sandbox-cache/<id>/gradle (MAX_PATH).
 * Junction that folder to C:\.gradle so Ninja sees short paths even when Cursor wins env.
 */
function junctionSandboxGradleToShortHome() {
  if (process.platform !== 'win32') return;
  try {
    fs.mkdirSync(WIN_GRADLE_HOME, { recursive: true });
  } catch {
    /* ignore */
  }
  const sandboxRoot = path.join(process.env.LOCALAPPDATA || '', 'Temp', 'cursor-sandbox-cache');
  if (!fs.existsSync(sandboxRoot)) return;

  for (const name of fs.readdirSync(sandboxRoot)) {
    const sandboxGradle = path.join(sandboxRoot, name, 'gradle');
    try {
      if (fs.existsSync(sandboxGradle)) {
        const stat = fs.lstatSync(sandboxGradle);
        if (stat.isSymbolicLink()) {
          continue;
        }
        // Never fs.rmSync a junction — can delete C:\.gradle. Use rmdir for directories/reparse points.
        spawnSync('cmd.exe', ['/c', 'rmdir', '/s', '/q', sandboxGradle], {
          stdio: 'ignore',
          shell: false,
        });
      }
      fs.mkdirSync(path.join(sandboxRoot, name), { recursive: true });
      fs.symlinkSync(WIN_GRADLE_HOME, sandboxGradle, 'junction');
      console.info('[expo-run-android] Junction %s -> %s', sandboxGradle, WIN_GRADLE_HOME);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn('[expo-run-android] Could not junction %s: %s', sandboxGradle, message);
    }
  }
}

/** Remove CMake/.cxx outputs that still reference old long transform paths. */
function cleanStaleAndroidNativeBuild() {
  if (process.platform !== 'win32') return;
  const targets = [
    path.join(projectRoot, 'android', '.gradle'),
    path.join(projectRoot, 'android', 'build'),
    path.join(projectRoot, 'android', 'app', 'build'),
    path.join(projectRoot, 'android', 'app', '.cxx'),
    path.join(projectRoot, 'node_modules', 'expo-modules-core', 'android', '.cxx'),
    path.join(projectRoot, 'node_modules', 'react-native-screens', 'android', '.cxx'),
    path.join(projectRoot, 'node_modules', 'react-native-gesture-handler', 'android', '.cxx'),
    path.join(projectRoot, 'node_modules', 'react-native-gesture-handler', 'android', 'build'),
  ];
  for (const target of targets) {
    if (!fs.existsSync(target)) continue;
    try {
      fs.rmSync(target, { recursive: true, force: true, maxRetries: 2 });
      console.info('[expo-run-android] Cleaned %s', target);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn('[expo-run-android] Could not clean %s: %s', target, message);
    }
  }
}

function resolveGradleUserHomeWin() {
  try {
    fs.mkdirSync(WIN_GRADLE_HOME, { recursive: true });
    return WIN_GRADLE_HOME;
  } catch {
    const fallback = path.join(process.env.USERPROFILE || process.env.HOME || '', '.gradle');
    if (!fallback || fallback === '.gradle') return undefined;
    try {
      fs.mkdirSync(fallback, { recursive: true });
      return fallback;
    } catch {
      return undefined;
    }
  }
}

let gradleUserHome = process.env.GRADLE_USER_HOME;
if (process.platform === 'win32') {
  junctionSandboxGradleToShortHome();
  cleanStaleAndroidNativeBuild();
  gradleUserHome = resolveGradleUserHomeWin();
  if (gradleUserHome) {
    process.env.GRADLE_USER_HOME = gradleUserHome;
    const gradlew = path.join(projectRoot, 'android', 'gradlew.bat');
    if (fs.existsSync(gradlew)) {
      const androidCwd = path.join(projectRoot, 'android');
      const stopEnv = { ...process.env };
      applyShortGradlePaths(stopEnv);
      // Use call + cwd so cmd parses gradlew.bat correctly (requires CRLF line endings).
      const stop = spawnSync('cmd.exe', ['/c', 'call', 'gradlew.bat', '--stop'], {
        stdio: 'inherit',
        shell: false,
        cwd: androidCwd,
        env: stopEnv,
      });
      if (stop.status !== 0) {
        console.warn('[expo-run-android] gradlew --stop returned %s (continuing)', stop.status);
      }
    }
    console.info('[expo-run-android] GRADLE_USER_HOME=%s', gradleUserHome);
  } else {
    console.warn(
      '[expo-run-android] Could not set a short GRADLE_USER_HOME; if the build fails with MAX_PATH, create C:\\.gradle or enable Windows long paths.',
    );
  }
}

/** USB dev build: device opens 127.0.0.1 (adb reverse), not LAN IP (often ECONNREFUSED). */
function adbReverseMetroPorts() {
  const list = spawnSync('adb', ['devices'], { encoding: 'utf8', shell: false });
  if (list.status !== 0 || !/device\s*$/m.test(list.stdout.replace('List of devices attached', ''))) {
    return;
  }
  for (const port of [8081, 8082, 8083]) {
    spawnSync('adb', ['reverse', `tcp:${port}`, `tcp:${port}`], { stdio: 'ignore', shell: false });
  }
  console.info('[expo-run-android] adb reverse tcp:8081-8083 (use bundle URL http://127.0.0.1:<port>)');
}

adbReverseMetroPorts();

const env = { ...process.env };
env.REACT_NATIVE_PACKAGER_HOSTNAME = env.REACT_NATIVE_PACKAGER_HOSTNAME || '127.0.0.1';
if (process.platform === 'win32' && gradleUserHome) {
  applyShortGradlePaths(env);
  console.info(
    '[expo-run-android] Using short paths: GRADLE_USER_HOME=%s TEMP=%s',
    env.GRADLE_USER_HOME,
    env.TEMP,
  );
}

const expoCli = path.join(projectRoot, 'node_modules', 'expo', 'bin', 'cli');
if (!fs.existsSync(expoCli)) {
  console.error('[expo-run-android] Missing node_modules/expo — run bun install first.');
  process.exit(1);
}

/** Real Node binary (not Bun) — required for Expo CLI + Gradle on Windows. */
function resolveNodeCmd() {
  if (!isBunRuntime) {
    return nodeExe;
  }
  const nodeOnPath = spawnSync('where', ['node'], { encoding: 'utf8', shell: true });
  const fromPath =
    nodeOnPath.status === 0 ? nodeOnPath.stdout.trim().split(/\r?\n/)[0]?.trim() : '';
  return fromPath || 'node';
}

const nodeCmd = resolveNodeCmd();
if (isBunRuntime) {
  console.info('[expo-run-android] Using %s for expo run:android (Bun cannot spawn npx/gradlew on Windows)', nodeCmd);
}

const r = spawnSync(nodeCmd, [expoCli, 'run:android', ...extraArgs], {
  stdio: 'inherit',
  shell: false,
  cwd: projectRoot,
  env,
  windowsHide: true,
});

if (r.error) {
  console.error('[expo-run-android]', r.error.message);
  process.exit(1);
}
process.exit(r.status === null ? 1 : r.status);
