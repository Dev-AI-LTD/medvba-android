/**
 * Fetch current user from the identity provider userinfo endpoint using an access token.
 * @see https://docs.kinde.com/api/oauth2/user-profile/
 */
export async function fetchKindeUserProfile(
  accessToken: string,
): Promise<Response> {
  const issuer = (process.env.KINDE_ISSUER_URL || process.env.KINDE_SITE_URL || "")
    .trim()
    .replace(/\/+$/, "");
  if (!issuer) {
    throw new Error("KINDE_ISSUER_URL is not configured.");
  }
  return fetch(`${issuer}/oauth2/user_profile`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
}
