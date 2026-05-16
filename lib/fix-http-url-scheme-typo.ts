/**
 * Turns accidental `https;//host` / `http;//host` (semicolon instead of colon)
 * into valid `https://host`. Common paste / keyboard typo; breaks DNS (`NAME_NOT_RESOLVED`).
 */
export function fixHttpSchemeColonTypo(url: string): string {
  return url
    .trim()
    .replace(/^https\s*;\s*\/\//i, "https://")
    .replace(/^http\s*;\s*\/\//i, "http://");
}
