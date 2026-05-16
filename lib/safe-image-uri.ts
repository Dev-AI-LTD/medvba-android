const DICEBEAR = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(seed)}`;

/** Avoids `Image` / `source.uri` warnings when profile URLs are blank or whitespace-only. */
export function safeAvatarUri(uri: string | null | undefined, seed: string): string {
  const u = typeof uri === 'string' ? uri.trim() : '';
  if (u.length > 0) return u;
  const s = typeof seed === 'string' && seed.trim().length > 0 ? seed.trim() : 'medvba';
  return DICEBEAR(s);
}
