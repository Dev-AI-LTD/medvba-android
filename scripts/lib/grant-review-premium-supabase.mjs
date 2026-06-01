/**
 * Upsert Premium for App Review demo user (service role — bypasses RLS).
 */

import { createClient } from '@supabase/supabase-js';

/**
 * MEDVBA profiles.id is UUID; Kinde user id is kp_… on profiles.kinde_sub.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {{ kindeUserId?: string; email?: string }} lookup
 * @returns {Promise<string | null>}
 */
export async function resolveSupabaseProfileId(admin, lookup) {
  const email = lookup.email?.trim().toLowerCase();
  const kindeUserId = lookup.kindeUserId?.trim();

  if (kindeUserId) {
    const { data, error } = await admin
      .from('profiles')
      .select('id')
      .eq('kinde_sub', kindeUserId)
      .maybeSingle();
    if (error) throw new Error(`profiles by kinde_sub: ${error.message}`);
    if (data?.id) return data.id;
  }

  if (email) {
    const { data, error } = await admin
      .from('profiles')
      .select('id, kinde_sub')
      .ilike('email', email)
      .limit(1);
    if (error) throw new Error(`profiles by email: ${error.message}`);
    const row = data?.[0];
    if (row?.id) return row.id;
  }

  return null;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {{ kindeUserId: string; email: string; name?: string }} input
 */
export async function ensureSupabaseProfileForKinde(admin, input) {
  const existing = await resolveSupabaseProfileId(admin, {
    kindeUserId: input.kindeUserId,
    email: input.email,
  });
  if (existing) return { profileId: existing, created: false };

  const profileId = crypto.randomUUID();
  const name = input.name?.trim() || input.email.split('@')[0] || 'App Review';
  const avatar = `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(profileId)}`;

  const { error } = await admin.from('profiles').insert({
    id: profileId,
    kinde_sub: input.kindeUserId,
    name,
    avatar,
    profile_photo_url: avatar,
    email: input.email.trim().toLowerCase(),
    is_public: true,
  });

  if (error) {
    const retry = await resolveSupabaseProfileId(admin, { kindeUserId: input.kindeUserId });
    if (retry) return { profileId: retry, created: false };
    throw new Error(`profiles insert: ${error.message}`);
  }

  return { profileId, created: true };
}

/**
 * @param {{ supabaseUrl: string; serviceRoleKey: string; userId: string }} opts
 */
export async function grantReviewPremiumInSupabase(opts) {
  const { supabaseUrl, serviceRoleKey, userId } = opts;
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const nowIso = new Date().toISOString();

  const { error: subError } = await admin.from('subscriptions').upsert(
    {
      user_id: userId,
      status: 'premium',
      type: 'yearly',
      expires_at: null,
      updated_at: nowIso,
      started_at: nowIso,
    },
    { onConflict: 'user_id' },
  );

  if (subError) {
    throw new Error(`subscriptions upsert: ${subError.message}`);
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      is_premium: true,
      subscription_status: 'premium',
      updated_at: nowIso,
    })
    .eq('id', userId);

  if (profileError) {
    throw new Error(`profiles update: ${profileError.message}`);
  }

  return { userId, status: 'premium' };
}
