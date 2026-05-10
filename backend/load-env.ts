/**
 * Must be imported before any other backend module that reads process.env at load time.
 */
import { resolve } from "path";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

if (!process.env.SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_URL) {
  process.env.SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL.trim();
}

if (!process.env.KINDE_ISSUER_URL && process.env.EXPO_PUBLIC_KINDE_ISSUER_URL) {
  process.env.KINDE_ISSUER_URL = process.env.EXPO_PUBLIC_KINDE_ISSUER_URL.trim();
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
