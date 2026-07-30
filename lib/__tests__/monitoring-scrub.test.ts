/**
 * Unit checks for Sentry scrub helpers (via re-exported logic pattern).
 * Full beforeSend runs only in production init; we test scrub behavior inline.
 */

function scrubString(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, 'Bearer [redacted]')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[jwt-redacted]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email-redacted]')
    .replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=\s]+/gi, '[image-data-url-redacted]')
    .replace(/[A-Za-z0-9+/]{200,}={0,2}/g, '[base64-redacted]');
}

describe('monitoring scrub patterns', () => {
  it('redacts Authorization bearer tokens', () => {
    const out = scrubString('Authorization: Bearer eyJhbG.test.sig');
    expect(out).toContain('Bearer [redacted]');
    expect(out).not.toContain('eyJhbG');
  });

  it('redacts emails and data URLs', () => {
    const email = scrubString('user@example.com failed');
    expect(email).toContain('[email-redacted]');
    const img = scrubString('data:image/png;base64,AAAA');
    expect(img).toBe('[image-data-url-redacted]');
  });
});
