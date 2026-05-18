import { supabase } from '@/lib/supabase';

/** Ensures a Kinde/MEDVBA profile row exists before FK inserts (chat, progress, etc.). */
export async function ensureProfileExists(
  profileId: string,
  name?: string,
): Promise<void> {
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', profileId)
    .maybeSingle();

  if (existing?.id) return;

  await supabase.from('profiles').insert({
    id: profileId,
    name: name || 'Student',
    avatar: `https://api.dicebear.com/7.x/avataaars/png?seed=${profileId}`,
    profile_photo_url: `https://api.dicebear.com/7.x/avataaars/png?seed=${profileId}`,
  });
}
