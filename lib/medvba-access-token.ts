/** In-memory Supabase-compatible JWT (minted by backend /api/auth/session). */
let medvbaAccessToken: string | null = null;

export function setMedvbaAccessToken(token: string | null) {
  medvbaAccessToken = token;
}

export function getMedvbaAccessToken(): string | null {
  return medvbaAccessToken;
}
