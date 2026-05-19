/** Standard Study summary section headings (RO / EN). */
export const STUDY_SUMMARY_SECTIONS = {
  ro: {
    learn: 'Ce înveți în acest capitol',
    concepts: 'Concepte cheie',
    clinical: 'Legături clinice și admitere',
    pitfalls: 'Capcane frecvente la examen',
    mini: 'Mini-rezumat',
  },
  en: {
    learn: 'What you learn in this chapter',
    concepts: 'Key concepts',
    clinical: 'Clinical and exam connections',
    pitfalls: 'Common exam pitfalls',
    mini: 'Mini-summary',
  },
} as const;

export type StudySummarySectionKind = 'learn' | 'concepts' | 'clinical' | 'pitfalls' | 'mini' | 'other';

export function classifyStudySectionHeading(
  heading: string,
  locale: 'ro' | 'en',
): StudySummarySectionKind {
  const h = heading.trim().toLowerCase();
  const sections = STUDY_SUMMARY_SECTIONS[locale];
  if (h === sections.learn.toLowerCase()) return 'learn';
  if (h === sections.concepts.toLowerCase()) return 'concepts';
  if (h === sections.clinical.toLowerCase()) return 'clinical';
  if (h === sections.pitfalls.toLowerCase()) return 'pitfalls';
  if (h === sections.mini.toLowerCase()) return 'mini';
  return 'other';
}
