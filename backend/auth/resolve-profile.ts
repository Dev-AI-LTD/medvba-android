import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

export type KindeUserProfile = {
  id: string;
  preferred_email?: string | null;
  email?: string | null;
  given_name?: string | null;
  family_name?: string | null;
  picture?: string | null;
};

function displayNameFromKinde(p: KindeUserProfile): string {
  const g = p.given_name?.trim() || "";
  const f = p.family_name?.trim() || "";
  const joined = `${g} ${f}`.trim();
  if (joined) return joined;
  const e = p.preferred_email || p.email;
  if (e) return e.split("@")[0] || "Student";
  return "Student";
}

/**
 * Ensures a profiles row exists for this identity user. Links legacy rows by email when kinde_sub is null.
 */
export async function resolveOrCreateProfileId(
  admin: SupabaseClient,
  kinde: KindeUserProfile,
): Promise<{ profileId: string; created: boolean }> {
  const kindeSub = kinde.id;
  const email = (kinde.preferred_email || kinde.email || "").trim().toLowerCase() || null;

  const { data: byKinde, error: e1 } = await admin
    .from("profiles")
    .select("id")
    .eq("kinde_sub", kindeSub)
    .maybeSingle();
  if (e1) throw e1;
  if (byKinde?.id) {
    if (email) {
      await admin.from("profiles").update({ email }).eq("id", byKinde.id);
    }
    return { profileId: byKinde.id, created: false };
  }

  if (email) {
    const { data: linkRows, error: e2 } = await admin
      .from("profiles")
      .select("id, kinde_sub")
      .ilike("email", email)
      .is("kinde_sub", null)
      .limit(1);
    if (e2) throw e2;
    const byEmail = linkRows?.[0];
    if (byEmail?.id) {
      const { error: e3 } = await admin
        .from("profiles")
        .update({ kinde_sub: kindeSub, email })
        .eq("id", byEmail.id);
      if (e3) throw e3;
      return { profileId: byEmail.id, created: false };
    }
  }

  const profileId = randomUUID();
  const name = displayNameFromKinde(kinde);
  const avatarSeed = encodeURIComponent(profileId);
  const avatar = `https://api.dicebear.com/7.x/avataaars/png?seed=${avatarSeed}`;

  const row: Record<string, unknown> = {
    id: profileId,
    kinde_sub: kindeSub,
    name,
    avatar,
    profile_photo_url: avatar,
    email,
    is_public: true,
  };

  const { error: insErr } = await admin.from("profiles").insert(row);
  if (insErr) {
    const { data: race } = await admin
      .from("profiles")
      .select("id")
      .eq("kinde_sub", kindeSub)
      .maybeSingle();
    if (race?.id) return { profileId: race.id, created: false };
    throw insErr;
  }

  return { profileId, created: true };
}

export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }
  return createClient(url, key);
}
