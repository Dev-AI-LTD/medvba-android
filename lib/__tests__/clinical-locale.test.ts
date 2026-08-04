import {
  CLINICAL_DISCLAIMER_EN,
  CLINICAL_DISCLAIMER_ES,
  CLINICAL_DISCLAIMER_RO,
} from '@/constants/clinical-copilot';
import {
  clinicalDisclaimer,
  getCaseKickoffUserMessage,
  getCaseSystemPrompt,
  getExplainSystemPrompt,
  getImageAnalysisUserText,
  getImageSystemPrompt,
  getReplyModeHint,
  getSummarySystemPrompt,
} from '@/backend/lib/clinical-prompts';
import { tutorLocaleSchema } from '@/lib/tutor-locale';
import { es } from '@/locales/es';
import { en } from '@/locales/en';
import { ro } from '@/locales/ro';

describe('Clinical locale schema', () => {
  it.each(['en', 'ro', 'es'] as const)('accepts %s', (locale) => {
    expect(tutorLocaleSchema.parse(locale)).toBe(locale);
  });

  it('rejects invalid locales', () => {
    expect(() => tutorLocaleSchema.parse('pt')).toThrow();
  });
});

describe('clinicalDisclaimer', () => {
  it('returns locale-specific educational disclaimers', () => {
    expect(clinicalDisclaimer('en')).toBe(CLINICAL_DISCLAIMER_EN);
    expect(clinicalDisclaimer('ro')).toBe(CLINICAL_DISCLAIMER_RO);
    expect(clinicalDisclaimer('es')).toBe(CLINICAL_DISCLAIMER_ES);
  });
});

describe('Clinical prompt response-language rules', () => {
  it('EN explain/case keep English response rule', () => {
    expect(getExplainSystemPrompt('en')).toContain('Always respond in English.');
    expect(getCaseSystemPrompt('en', 'chest_pain')).toContain('Always respond in English.');
    expect(getExplainSystemPrompt('en')).not.toMatch(/română|español/i);
  });

  it('RO explain/case keep Romanian response rule', () => {
    expect(getExplainSystemPrompt('ro')).toContain('Răspunde întotdeauna în limba română.');
    expect(getCaseSystemPrompt('ro', 'chest_pain')).toContain(
      'Răspunde întotdeauna în limba română.',
    );
  });

  it('ES prompts require Spanish and must not follow English source language', () => {
    for (const prompt of [
      getExplainSystemPrompt('es'),
      getCaseSystemPrompt('es', 'chest_pain'),
      getImageSystemPrompt('es'),
      getSummarySystemPrompt('es'),
    ]) {
      expect(prompt).toMatch(/Responde únicamente en español/i);
      expect(prompt).toMatch(/No cambies de idioma/i);
      expect(prompt).not.toContain('Always respond in English.');
      expect(prompt).not.toMatch(/limba română/i);
    }
    // Image/summary embed the educational disclaimer text in the system prompt.
    expect(getImageSystemPrompt('es')).toContain(CLINICAL_DISCLAIMER_ES);
    expect(getSummarySystemPrompt('es')).toContain(CLINICAL_DISCLAIMER_ES);
  });

  it('preserves EN/RO image and summary short language lines', () => {
    expect(getImageSystemPrompt('en')).toContain('Respond in English.');
    expect(getSummarySystemPrompt('en')).toContain('Respond in English.');
    expect(getImageSystemPrompt('ro')).toContain('Răspunde în limba română.');
    expect(getSummarySystemPrompt('ro')).toContain('Răspunde în limba română.');
  });
});

describe('Clinical request locale preservation helpers', () => {
  it('kickoff and image default user text follow UI locale including es', () => {
    expect(getCaseKickoffUserMessage('es', 'chest_pain')).toMatch(/caso clínico educativo/i);
    expect(getCaseKickoffUserMessage('es', 'chest_pain')).toMatch(/Dolor torácico/);
    expect(getImageAnalysisUserText('es')).toMatch(/análisis educativo/i);
    expect(getImageAnalysisUserText('en')).toBe(
      'Provide a guided educational analysis of this image.',
    );
    expect(getImageAnalysisUserText('ro')).toBe('Analizează imaginea în scop didactic.');
  });

  it('reply mode hints support es', () => {
    expect(getReplyModeHint('es', 'differential')).toMatch(/diagnóstico diferencial/i);
    expect(getReplyModeHint('en', 'differential')).toMatch(/differential diagnosis/i);
    expect(getReplyModeHint('ro', 'differential')).toMatch(/diferențial/i);
  });
});

describe('Clinical ES UI catalog', () => {
  const requiredKeys = [
    'clinical.disclaimer',
    'clinical.acceptDisclaimer',
    'clinical.pickCaseFirst',
    'clinical.analyzeImage',
    'clinical.generateSummary',
    'clinical.topic.chest_pain',
    'clinical.apiUnavailable',
    'clinical.howToTitle',
  ] as const;

  it('includes required clinical.* keys in es (parity with en/ro presence)', () => {
    for (const key of requiredKeys) {
      expect(typeof en[key]).toBe('string');
      expect(typeof ro[key]).toBe('string');
      expect(typeof es[key]).toBe('string');
      expect(es[key].length).toBeGreaterThan(0);
    }
  });

  it('uses Spanish educational disclaimer copy in the UI catalog', () => {
    expect(es['clinical.disclaimer']).toMatch(/educativo|simulado/i);
    expect(es['clinical.disclaimer']).toMatch(/no sustituye/i);
  });
});
