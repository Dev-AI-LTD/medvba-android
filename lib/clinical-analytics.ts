/**
 * Clinical Copilot analytics (flag-gated). Uses existing monitoring breadcrumbs.
 */

import { isClinicalCopilotUiEnabled } from '@/lib/clinical-copilot-flag';
import { logEvent } from '@/lib/monitoring';

export type ClinicalEventName =
  | 'clinical_opened'
  | 'clinical_disclaimer_accepted'
  | 'clinical_explain_started'
  | 'clinical_explain_completed'
  | 'clinical_case_started'
  | 'clinical_reply_sent'
  | 'clinical_image_started'
  | 'clinical_summary_generated'
  | 'clinical_paywall_shown'
  | 'clinical_topup_shown'
  | 'clinical_topup_intent'
  | 'clinical_insufficient_credits'
  | 'clinical_stream_used'
  | 'clinical_home_card_tapped';

export function trackClinicalEvent(
  name: ClinicalEventName,
  properties?: Record<string, unknown>,
): void {
  if (!isClinicalCopilotUiEnabled()) return;
  logEvent(name, properties);
}
