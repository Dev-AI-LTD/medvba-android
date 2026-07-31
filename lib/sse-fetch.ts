/**
 * SSE fetch for React Native: uses expo/fetch (ReadableStream body).
 * Falls back to buffering full response text when body is unavailable.
 */

import { fetch as expoFetch } from 'expo/fetch';

type SseState = {
  eventName: string;
  donePayload: Record<string, unknown> | null;
};

function consumeSseLines(
  lines: string[],
  state: SseState,
  onDelta: (text: string) => void,
): void {
  for (const line of lines) {
    if (line.startsWith('event:')) {
      state.eventName = line.slice(6).trim();
      continue;
    }
    if (!line.startsWith('data:')) continue;
    const data = line.slice(5).trim();
    if (!data) continue;
    let json: Record<string, unknown>;
    try {
      json = JSON.parse(data) as Record<string, unknown>;
    } catch {
      state.eventName = 'message';
      continue;
    }
    if (state.eventName === 'delta' && typeof json.text === 'string') {
      onDelta(json.text);
    } else if (state.eventName === 'done') {
      state.donePayload = json;
    } else if (state.eventName === 'error') {
      throw new Error(String(json.error ?? 'Stream error'));
    }
    state.eventName = 'message';
  }
}

export async function fetchSse(params: {
  url: string;
  token: string;
  body: unknown;
  signal?: AbortSignal;
  onDelta: (text: string) => void;
}): Promise<Record<string, unknown>> {
  const res = await expoFetch(params.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.token}`,
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(params.body),
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

  const state: SseState = { eventName: 'message', donePayload: null };

  if (res.body) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n');
      buffer = parts.pop() ?? '';
      consumeSseLines(parts, state, params.onDelta);
    }
    if (buffer.trim()) {
      consumeSseLines([buffer], state, params.onDelta);
    }
  } else {
    const text = await res.text();
    if (!text.trim()) {
      throw new Error('Empty stream body');
    }
    consumeSseLines(text.split('\n'), state, params.onDelta);
  }

  if (!state.donePayload) {
    throw new Error('Stream ended without completion event');
  }
  return state.donePayload;
}
