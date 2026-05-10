import { getApiBaseUrl } from "@/lib/api-base-url";
import { setMedvbaAccessToken } from "@/lib/medvba-access-token";

export type ExchangeSessionResult =
  | { ok: true; access_token: string; profile_id: string }
  | { ok: false; error: string; status?: number };

/**
 * Exchange a Kinde access token for a Supabase-compatible JWT (HS256, minted by backend).
 */
export async function exchangeKindeAccessToken(
  kindeAccessToken: string,
): Promise<ExchangeSessionResult> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/auth/session`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${kindeAccessToken}`,
      Accept: "application/json",
    },
  });
  const json = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    profile_id?: string;
    error?: string;
  };
  if (!res.ok) {
    return { ok: false, error: json.error || res.statusText, status: res.status };
  }
  if (!json.access_token || !json.profile_id) {
    return { ok: false, error: "Invalid session response from server." };
  }
  setMedvbaAccessToken(json.access_token);
  return { ok: true, access_token: json.access_token, profile_id: json.profile_id };
}

export async function exchangeEmailPasswordSession(
  email: string,
  password: string,
): Promise<ExchangeSessionResult> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/auth/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email: email.trim(), password }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    profile_id?: string;
    error?: string;
  };
  if (!res.ok) {
    return { ok: false, error: json.error || res.statusText, status: res.status };
  }
  if (!json.access_token || !json.profile_id) {
    return { ok: false, error: json.error || "Login failed." };
  }
  setMedvbaAccessToken(json.access_token);
  return { ok: true, access_token: json.access_token, profile_id: json.profile_id };
}
