/** Pilot module for chapter summaries (medical school entrance exam). */
export const STUDY_PILOT_MODULE_ID = 'med-admission-barrons' as const;

/** Free preview chapters (no Premium required) — Admitere. */
export const STUDY_FREE_PREVIEW_CHAPTER_IDS = [
  'intro-anat-phys',
  'chem-basics',
  'cell-biology',
] as const;

export type StudyFreePreviewChapterId = (typeof STUDY_FREE_PREVIEW_CHAPTER_IDS)[number];

/** Free preview chapters for Cap și Gât (Home). */
export const STUDY_HEAD_NECK_FREE_PREVIEW_CHAPTER_IDS = ['head-neck-intro'] as const;

/** Free preview chapters for Organe Interne (granular topic summaries). */
export const STUDY_INTERNAL_ORGANS_FREE_PREVIEW_CHAPTER_IDS = [
  'internal-organs-intro',
  'heart-external',
] as const;

/** All anatomy modules shown in Study tab (content rolls out progressively). */
export const STUDY_MODULE_IDS = [
  'med-admission-barrons',
  'head-neck',
  'upper-lower-limbs',
  'neuroanatomy',
  'internal-organs',
] as const;

export type StudyModuleId = (typeof STUDY_MODULE_IDS)[number];

export function isStudyFreePreviewChapter(
  chapterId: string,
  moduleId?: string,
): boolean {
  if (moduleId === 'head-neck') {
    return (STUDY_HEAD_NECK_FREE_PREVIEW_CHAPTER_IDS as readonly string[]).includes(
      chapterId,
    );
  }
  if (moduleId === 'internal-organs') {
    return (STUDY_INTERNAL_ORGANS_FREE_PREVIEW_CHAPTER_IDS as readonly string[]).includes(
      chapterId,
    );
  }
  return (STUDY_FREE_PREVIEW_CHAPTER_IDS as readonly string[]).includes(chapterId);
}

export function canAccessChapterSummary(
  chapterId: string,
  isPremium: boolean,
  moduleId?: string,
): boolean {
  if (isPremium) return true;
  return isStudyFreePreviewChapter(chapterId, moduleId);
}
