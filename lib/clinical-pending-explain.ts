/**
 * Bridge quiz "Explain clinically" → Clinical chat on Tutor tab.
 * Written by quiz-session; consumed once by tutor.tsx.
 */

export const CLINICAL_PENDING_EXPLAIN_KEY = 'clinical_pending_explain_v1';

export type ClinicalPendingExplain = {
  sessionId: string;
  response: string;
  /** Short user-facing prompt shown as the user bubble */
  userLabel: string;
  balance?: number;
  questionId?: string;
};
