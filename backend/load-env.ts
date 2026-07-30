/**
 * Must be imported before any other backend module that reads process.env at load time.
 */
import { resolve } from "path";
import { config } from "dotenv";

/** `https;//host` → `https://host` — breaks OAuth / DNS if pasted wrong in Railway. */
function fixHttpSchemeColonTypo(url: string): string {
  return url
    .trim()
    .replace(/^https\s*;\s*\/\//i, "https://")
    .replace(/^http\s*;\s*\/\//i, "http://");
}

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

if (process.env.SUPABASE_URL) {
  process.env.SUPABASE_URL = fixHttpSchemeColonTypo(process.env.SUPABASE_URL);
}

if (!process.env.SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_URL) {
  process.env.SUPABASE_URL = fixHttpSchemeColonTypo(process.env.EXPO_PUBLIC_SUPABASE_URL);
}

if (!process.env.KINDE_ISSUER_URL && process.env.EXPO_PUBLIC_KINDE_ISSUER_URL) {
  process.env.KINDE_ISSUER_URL = fixHttpSchemeColonTypo(process.env.EXPO_PUBLIC_KINDE_ISSUER_URL);
}
if (process.env.KINDE_ISSUER_URL) {
  process.env.KINDE_ISSUER_URL = fixHttpSchemeColonTypo(process.env.KINDE_ISSUER_URL);
}
if (!process.env.KINDE_CLIENT_ID && process.env.EXPO_PUBLIC_KINDE_CLIENT_ID) {
  process.env.KINDE_CLIENT_ID = process.env.EXPO_PUBLIC_KINDE_CLIENT_ID.trim();
}

function trimKey(name: string) {
  const v = process.env[name];
  if (typeof v === "string") {
    const t = v.trim().replace(/^["']|["']$/g, "");
    process.env[name] = t || undefined;
  }
}

trimKey("AI_API_KEY");
trimKey("OPENAI_API_KEY");
trimKey("AI_PROVIDER");
trimKey("META_MODEL_API_KEY");
trimKey("META_MODEL_API_BASE_URL");
trimKey("META_MODEL_BASE_URL");
trimKey("META_MODEL_NAME");
trimKey("INTERNAL_HEALTH_SECRET");
trimKey("REVENUECAT_WEBHOOK_AUTHORIZATION");
trimKey("REVENUECAT_ENTITLEMENT_ID");
trimKey("REVENUECAT_SECRET_API_KEY");
trimKey("REVENUECAT_API_SECRET_KEY");
trimKey("SUPABASE_JWT_SIGNING_SECRET");
trimKey("KINDE_CLIENT_SECRET");
trimKey("SUPABASE_SERVICE_ROLE_KEY");
trimKey("REDIS_URL");
trimKey("UPSTASH_REDIS_REST_URL");
trimKey("UPSTASH_REDIS_REST_TOKEN");
