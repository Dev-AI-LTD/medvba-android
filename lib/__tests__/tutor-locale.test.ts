import {
  getTutorAssistantPreamble,
  getTutorSystemPrompt,
} from '@/lib/ai-provider';
import {
  isTutorLocale,
  resolveTutorLocaleOrDefault,
  resolveTutorResponseLocale,
  tutorLocaleSchema,
} from '@/lib/tutor-locale';

describe('resolveTutorResponseLocale (UI locale → Tutor response language)', () => {
  it('maps en UI to en', () => {
    expect(resolveTutorResponseLocale('en')).toBe('en');
  });

  it('maps ro UI to ro', () => {
    expect(resolveTutorResponseLocale('ro')).toBe('ro');
  });

  it('maps es UI to es (does not collapse to en)', () => {
    expect(resolveTutorResponseLocale('es')).toBe('es');
  });
});

describe('tutorLocaleSchema', () => {
  it.each(['en', 'ro', 'es'] as const)('accepts %s', (locale) => {
    expect(tutorLocaleSchema.parse(locale)).toBe(locale);
  });

  it('rejects invalid values', () => {
    expect(() => tutorLocaleSchema.parse('pt')).toThrow();
    expect(() => tutorLocaleSchema.parse('fr')).toThrow();
    expect(() => tutorLocaleSchema.parse('')).toThrow();
    expect(() => tutorLocaleSchema.parse(null)).toThrow();
  });

  it('defaults missing input when .default("en") is applied', () => {
    expect(tutorLocaleSchema.default('en').parse(undefined)).toBe('en');
  });
});

describe('resolveTutorLocaleOrDefault (stream / payload fallback)', () => {
  it('preserves en, ro, and es', () => {
    expect(resolveTutorLocaleOrDefault('en')).toBe('en');
    expect(resolveTutorLocaleOrDefault('ro')).toBe('ro');
    expect(resolveTutorLocaleOrDefault('es')).toBe('es');
  });

  it('falls back to en for invalid or missing values', () => {
    expect(resolveTutorLocaleOrDefault(undefined)).toBe('en');
    expect(resolveTutorLocaleOrDefault('pt')).toBe('en');
    expect(resolveTutorLocaleOrDefault(123)).toBe('en');
  });

  it('supports a custom fallback', () => {
    expect(resolveTutorLocaleOrDefault('nope', 'ro')).toBe('ro');
  });
});

describe('isTutorLocale', () => {
  it('returns true only for en|ro|es', () => {
    expect(isTutorLocale('en')).toBe(true);
    expect(isTutorLocale('ro')).toBe(true);
    expect(isTutorLocale('es')).toBe(true);
    expect(isTutorLocale('pt')).toBe(false);
  });
});

describe('getTutorSystemPrompt response-language rules', () => {
  it('EN prompt requires English replies', () => {
    const prompt = getTutorSystemPrompt('en');
    expect(prompt).toMatch(/Always respond in English/i);
    expect(prompt).not.toMatch(/limba română/i);
    expect(prompt).not.toMatch(/únicamente en español/i);
  });

  it('RO prompt requires Romanian replies', () => {
    const prompt = getTutorSystemPrompt('ro');
    expect(prompt).toMatch(/Răspunde întotdeauna în limba română/i);
    expect(prompt).not.toMatch(/Always respond in English/);
    expect(prompt).not.toMatch(/únicamente en español/i);
  });

  it('ES prompt requires Spanish replies and must not follow English source material', () => {
    const prompt = getTutorSystemPrompt('es');
    expect(prompt).toMatch(/Responde únicamente en español/i);
    expect(prompt).toMatch(/No cambies de idioma/i);
    expect(prompt).toMatch(/inglés/i);
    expect(prompt).not.toMatch(/Always respond in English/);
    expect(prompt).not.toMatch(/limba română/i);
  });
});

describe('getTutorAssistantPreamble', () => {
  it('returns locale-specific preambles', () => {
    expect(getTutorAssistantPreamble('en')).toMatch(/medical students/i);
    expect(getTutorAssistantPreamble('ro')).toMatch(/studenții la medicină/i);
    expect(getTutorAssistantPreamble('es')).toMatch(/estudiantes de medicina/i);
  });
});

describe('streaming / chat payload locale preservation', () => {
  it('keeps es through the same resolve used by tutor-stream', () => {
    const streamBody = {
      messages: [{ role: 'user' as const, content: 'What is systole?' }],
      locale: 'es' as const,
    };
    expect(resolveTutorLocaleOrDefault(streamBody.locale)).toBe('es');
    expect(tutorLocaleSchema.parse(streamBody.locale)).toBe('es');
  });

  it('keeps es through the chat input shape', () => {
    const chatInput = {
      messages: [{ role: 'user' as const, content: 'What is systole?' }],
      locale: resolveTutorResponseLocale('es'),
    };
    expect(chatInput.locale).toBe('es');
    expect(tutorLocaleSchema.parse(chatInput.locale)).toBe('es');
  });
});
