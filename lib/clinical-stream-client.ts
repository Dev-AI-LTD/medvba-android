/**
 * Client helper for Clinical Copilot SSE streaming (flag ON only).
 */

import { getApiBaseUrl } from '@/lib/api-base-url';

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
  const res = await fetch(`${base}/api/clinical/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.token}`,
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({
      sessionId: params.sessionId,
      message: params.message,
      locale: params.locale,
      mode: params.mode,
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
  let donePayload: ClinicalStreamDone | null = null;
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
          donePayload = json as unknown as ClinicalStreamDone;
        } else if (eventName === 'error') {
          throw new Error(String(json.error ?? 'Stream error'));
        }
      } catch (e) {
        if (e instanceof Error && e.message !== 'Stream error' && !e.message.startsWith('Stream')) {
          // JSON parse of partial — ignore unless it's our thrown error
          if (eventName === 'error') throw e;
        } else {
          throw e;
        }
      }
      eventName = 'message';
    }
  }

  if (!donePayload) {
    throw new Error('Stream ended without completion event');
  }
  return donePayload;
}
