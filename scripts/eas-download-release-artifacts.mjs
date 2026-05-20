#!/usr/bin/env node
/**
 * Download Play release artifacts from a finished EAS Android build:
 * - applicationArchiveUrl (.aab)
 * - buildArtifactsUrl (zip: mapping.txt + native-debug-symbols.zip)
 *
 * Usage:
 *   node scripts/eas-download-release-artifacts.mjs [--latest] [buildId]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const require = createRequire(import.meta.url);

const easCliRoot = path.join(
  process.env.APPDATA || path.join(process.env.HOME || "", ".config"),
  "npm",
  "node_modules",
  "eas-cli",
);
const { createGraphqlClient } = require(path.join(
  easCliRoot,
  "build/commandUtils/context/contextUtils/createGraphqlClient.js",
));

const STATE_PATH = path.join(process.env.USERPROFILE || process.env.HOME || "", ".expo", "state.json");

async function getSession() {
  const accessToken = process.env.EXPO_TOKEN?.trim() || null;
  let sessionSecret = null;
  if (!accessToken) {
    try {
      const auth = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"))?.auth;
      sessionSecret = auth?.sessionSecret ?? null;
    } catch {
      sessionSecret = null;
    }
  }
  if (!accessToken && !sessionSecret) {
    console.error("Not logged in. Run: npx eas-cli login");
    process.exit(1);
  }
  return { accessToken, sessionSecret };
}

async function fetchBuild(graphqlClient, buildId) {
  const { gql } = await import("graphql-tag");
  const query = gql`
    query BuildArtifactsQuery($buildId: ID!) {
      build {
        byId(buildId: $buildId) {
          id
          status
          platform
          appVersion
          appBuildVersion
          artifacts {
            applicationArchiveUrl
            buildArtifactsUrl
          }
        }
      }
    }
  `;
  const data = await graphqlClient.query(query, { buildId }).toPromise();
  return data.data?.build?.byId ?? null;
}

async function downloadFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download failed ${res.status}: ${url}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, buf);
  console.log(`Saved: ${destPath} (${(buf.length / 1024).toFixed(1)} KB)`);
}

function resolveBuildId(argv) {
  const latest = argv.includes("--latest");
  const id = argv.find((a) => !a.startsWith("-"));
  if (id) return id;
  if (!latest) {
    console.error("Usage: node scripts/eas-download-release-artifacts.mjs [--latest] [buildId]");
    process.exit(1);
  }
  const isWin = process.platform === "win32";
  const r = spawnSync(isWin ? "npx.cmd" : "npx", ["-y", "eas-cli", "build:list", "--platform", "android", "--profile", "production", "--limit", "5", "--json", "--non-interactive"], {
    cwd: root,
    encoding: "utf8",
    shell: isWin,
  });
  const m = (r.stdout || "").match(/\[[\s\S]*\]/);
  if (!m) throw new Error("Could not parse eas build:list output");
  const builds = JSON.parse(m[0]);
  const finished = builds.find((b) => b.status === "FINISHED");
  if (!finished) throw new Error("No FINISHED production Android build found");
  return finished.id;
}

async function main() {
  const buildId = resolveBuildId(process.argv.slice(2));
  const auth = await getSession();
  const graphqlClient = createGraphqlClient(auth);
  const build = await fetchBuild(graphqlClient, buildId);

  if (!build) {
    console.error(`Build not found: ${buildId}`);
    process.exit(1);
  }
  if (build.status !== "FINISHED") {
    console.error(`Build ${buildId} status is ${build.status} — wait until FINISHED.`);
    process.exit(1);
  }

  const vc = build.appBuildVersion ?? "unknown";
  const vn = build.appVersion ?? "unknown";
  const outDir = path.join(root, "release-artifacts", `android-v${vc}-${vn}`);
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`\n=== MEDVBA release artifacts (build ${buildId}) ===`);
  console.log(`versionCode: ${vc}  versionName: ${vn}`);
  console.log(`Output: ${outDir}\n`);

  const { applicationArchiveUrl, buildArtifactsUrl } = build.artifacts ?? {};

  if (applicationArchiveUrl) {
    await downloadFile(applicationArchiveUrl, path.join(outDir, `medvba-v${vc}.aab`));
  } else {
    console.warn("WARN: No applicationArchiveUrl on this build.");
  }

  if (buildArtifactsUrl) {
    const zipPath = path.join(outDir, `eas-build-artifacts-v${vc}.zip`);
    await downloadFile(buildArtifactsUrl, zipPath);
    console.log(
      "\nExtract the zip — you need mapping.txt for Play Console Deobfuscation file.",
    );
    console.log(`  Play Console → Release → App bundle explorer → version ${vc} → Deobfuscation file → upload mapping.txt`);
    console.log(`  Optional: native-debug-symbols.zip → Native debug symbols\n`);
  } else {
    console.warn(
      "WARN: No buildArtifactsUrl. Ensure eas.json production.android.buildArtifactPaths includes:",
    );
    console.warn("  android/app/build/outputs/mapping/release/mapping.txt");
    console.warn("  android/app/build/outputs/native-debug-symbols/release/native-debug-symbols.zip");
    console.warn("Download mapping.txt manually from expo.dev build → Artifacts.\n");
  }

  console.log(`Build page: https://expo.dev/accounts/devaieood79/projects/medvba/builds/${buildId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
