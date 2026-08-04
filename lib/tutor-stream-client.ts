/**
 * Client helper for AI Tutor SSE streaming.
 */

import { getApiBaseUrl } from '@/lib/api-base-url';
import { fetchSse } from '@/lib/sse-fetch';
import type { TutorLocale } from '@/lib/tutor-locale';

export type TutorStreamDone = {
  response: string;
};

export async function streamTutorReply(params: {
  token: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  locale: TutorLocale;
  onDelta: (chunk: string) => void;
  signal?: AbortSignal;
}): Promise<TutorStreamDone> {
  const base = getApiBaseUrl().replace(/\/$/, '');
  const done = await fetchSse({
    url: `${base}/api/tutor/stream`,
    token: params.token,
    body: {
      messages: params.messages,
      locale: params.locale,
    },
    signal: params.signal,
    onDelta: params.onDelta,
  });
  return {
    response: typeof done.response === 'string' ? done.response : '',
  };
}
