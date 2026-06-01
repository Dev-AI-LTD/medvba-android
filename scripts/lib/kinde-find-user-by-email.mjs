/**
 * Resolve Kinde user id (profile_id in MEDVBA) by email via Management API (M2M).
 * Does not use password grant (ROPC).
 */

/**
 * @param {{ issuer: string; m2mId: string; m2mSecret: string; email: string }} opts
 * @returns {Promise<string | null>}
 */
export async function findKindeUserIdByEmail(opts) {
  const issuer = opts.issuer.replace(/\/+$/, '');
  const email = opts.email.trim().toLowerCase();
  if (!email.includes('@')) return null;

  const audience =
    (process.env.KINDE_MANAGEMENT_AUDIENCE || process.env.KINDE_AUDIENCE || '').trim().replace(/\/+$/, '') ||
    `${issuer}/api`;

  const tokenBody = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: opts.m2mId,
    client_secret: opts.m2mSecret,
    audience,
    scope:
      (process.env.KINDE_M2M_TOKEN_SCOPE || '').trim() ||
      'read:users update:users create:users delete:users',
  });

  const tokenRes = await fetch(`${issuer}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenBody,
  });
  if (!tokenRes.ok) {
    const t = await tokenRes.text().catch(() => '');
    throw new Error(`Kinde M2M token failed HTTP ${tokenRes.status}: ${t.slice(0, 200)}`);
  }
  const tokenJson = await tokenRes.json();
  const m2mToken = tokenJson.access_token;
  if (!m2mToken) throw new Error('Kinde M2M: no access_token');

  const searchRes = await fetch(`${issuer}/api/v1/search/users?query=${encodeURIComponent(email)}`, {
    headers: { Authorization: `Bearer ${m2mToken}`, Accept: 'application/json' },
  });
  const raw = await searchRes.text().catch(() => '');
  if (!searchRes.ok) {
    throw new Error(`Kinde user search failed HTTP ${searchRes.status}: ${raw.slice(0, 200)}`);
  }

  let parsed = {};
  try {
    parsed = raw.trim() ? JSON.parse(raw) : {};
  } catch {
    throw new Error('Kinde user search: invalid JSON');
  }

  const rows = Array.isArray(parsed.results) ? parsed.results : [];
  for (const row of rows) {
    if (
      typeof row.id === 'string' &&
      row.id.length > 0 &&
      typeof row.email === 'string' &&
      row.email.trim().toLowerCase() === email
    ) {
      return row.id;
    }
  }
  return null;
}
