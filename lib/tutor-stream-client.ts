/**
 * Client helper for AI Tutor SSE streaming.
 */

import { getApiBaseUrl } from '@/lib/api-base-url';

export type TutorStreamDone = {
  response: string;
};

export async function streamTutorReply(params: {
  token: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  locale: 'en' | 'ro';
  onDelta: (chunk: string) => void;
  signal?: AbortSignal;
}): Promise<TutorStreamDone> {
  const base = getApiBaseUrl().replace(/\/$/, '');
  const res = await fetch(`${base}/api/tutor/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.token}`,
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({
      messages: params.messages,
      locale: params.locale,
    }),
    signal: params.signal,
  });

  if (!res.ok) {
    let msg = `Stream failed (${res.status})`;
    try {
      const j = (await res.json()) as { error?: string };
      if (j.error) msg = j.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  if (!res.body) {
    throw new Error('Empty stream body');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let donePayload: TutorStreamDone | null = null;
  let eventName = 'message';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n');
    buffer = parts.pop() ?? '';

    for (const line of parts) {
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim();
        continue;
      }
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (!data) continue;
      try {
        const json = JSON.parse(data) as Record<string, unknown>;
        if (eventName === 'delta' && typeof json.text === 'string') {
          params.onDelta(json.text);
        } else if (eventName === 'done') {
          donePayload = json as unknown as TutorStreamDone;
        } else if (eventName === 'error') {
          throw new Error(String(json.error ?? 'Stream error'));
        }
      } catch (e) {
        if (e instanceof Error && eventName === 'error') throw e;
      }
      eventName = 'message';
    }
  }

  if (!donePayload) {
    throw new Error('Stream ended without completion event');
  }
  return donePayload;
}
