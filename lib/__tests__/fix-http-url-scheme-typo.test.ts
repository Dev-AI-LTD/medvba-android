import { fixHttpSchemeColonTypo } from '@/lib/fix-http-url-scheme-typo';

describe('fixHttpSchemeColonTypo', () => {
  it('repairs semicolon typo after https:', () => {
    expect(fixHttpSchemeColonTypo('https;//dev.example.kinde.com/oauth2/foo')).toBe(
      'https://dev.example.kinde.com/oauth2/foo',
    );
  });

  it('leaves correct URLs untouched', () => {
    expect(fixHttpSchemeColonTypo('https://dev.example.kinde.com')).toBe(
      'https://dev.example.kinde.com',
    );
  });
});
