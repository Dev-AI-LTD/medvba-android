/**
 * Client helper for Clinical Copilot SSE streaming (flag ON only).
 */

import { getApiBaseUrl } from '@/lib/api-base-url';
import { fetchSse } from '@/lib/sse-fetch';

export type ClinicalStreamDone = {
  sessionId: string;
  response: string;
  disclaimer: string;
  balance: number;
};

export async function streamClinicalReply(params: {
  token: string;
  sessionId: string;
  message: string;
  locale: 'en' | 'ro';
  mode?: 'history' | 'exam' | 'labs' | 'differential' | 'management' | 'free';
  onDelta: (chunk: string) => void;
  signal?: AbortSignal;
}): Promise<ClinicalStreamDone> {
  const base = getApiBaseUrl().replace(/\/$/, '');
  const done = await fetchSse({
    url: `${base}/api/clinical/stream`,
    token: params.token,
    body: {
      sessionId: params.sessionId,
      message: params.message,
      locale: params.locale,
      mode: params.mode,
    },
    signal: params.signal,
    onDelta: params.onDelta,
  });
  return {
    sessionId: String(done.sessionId ?? params.sessionId),
    response: typeof done.response === 'string' ? done.response : '',
    disclaimer: typeof done.disclaimer === 'string' ? done.disclaimer : '',
    balance: typeof done.balance === 'number' ? done.balance : 0,
  };
}
