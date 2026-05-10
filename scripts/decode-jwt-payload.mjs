#!/usr/bin/env node
/**
 * Decode JWT payload (no signature verification) — for release smoke checks.
 * Usage: bun run release:decode-jwt -- '<access_token>'
 *    or: node scripts/decode-jwt-payload.mjs '<access_token>'
 */
import { decodeJwt } from "jose";

const token = process.argv[2];
if (!token || token === "--help" || token === "-h") {
  console.error("Usage: node scripts/decode-jwt-payload.mjs '<jwt>'");
  process.exit(1);
}

try {
  const payload = decodeJwt(token);
  console.log(JSON.stringify(payload, null, 2));
  const sub = payload.sub;
  const profileId = payload.profile_id;
  const role = payload.role;
  if (!sub) console.warn("⚠️  Missing claim: sub");
  if (!profileId) console.warn("⚠️  Missing claim: profile_id");
  if (role !== "authenticated") console.warn(`⚠️  role is "${role}" (expected authenticated)`);
  if (sub && profileId && role === "authenticated") {
    console.log("OK: sub + profile_id + role match MEDVBA RLS expectations (verify signature/secret in Supabase separately).");
  }
} catch (e) {
  console.error("Invalid JWT:", e?.message || e);
  process.exit(1);
}
