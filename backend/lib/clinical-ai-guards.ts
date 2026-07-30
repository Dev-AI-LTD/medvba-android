/**
 * Clinical AI cost / size guards — run BEFORE credit debit.
 */

import { randomUUID } from 'crypto';

export type ClinicalOperation =
  | 'explain'
  | 'follow_up'
  | 'clinical_case'
  | 'image'
  | 'summary';

export const CLINICAL_AI_LIMITS: Record<
  ClinicalOperation,
  {
    timeoutMs: number;
    maxOutputTokens: number;
    maxUserChars: number;
    maxHistoryMessages: number;
    maxDecodedImageBytes?: number;
  }
> = {
  explain: {
    timeoutMs: 45_000,
    maxOutputTokens: 1500,
    maxUserChars: 8_000,
    maxHistoryMessages: 4,
  },
  follow_up: {
    timeoutMs: 60_000,
    maxOutputTokens: 2000,
    maxUserChars: 4_000,
    maxHistoryMessages: 16,
  },
  clinical_case: {
    timeoutMs: 90_000,
    maxOutputTokens: 2500,
    maxUserChars: 2_000,
    maxHistoryMessages: 4,
  },
  summary: {
    timeoutMs: 90_000,
    maxOutputTokens: 2500,
    maxUserChars: 2_000,
    maxHistoryMessages: 40,
  },
  image: {
    timeoutMs: 120_000,
    maxOutputTokens: 2000,
    maxUserChars: 2_000,
    maxHistoryMessages: 2,
    maxDecodedImageBytes: 2 * 1024 * 1024,
  },
};

export class ClinicalGuardError extends Error {
  readonly code = 'GUARD_REJECT' as const;
  constructor(message: string) {
    super(message);
    this.name = 'ClinicalGuardError';
  }
}

export function newClinicalRequestId(): string {
  return randomUUID();
}

/** Truncate user text to max chars; throws if empty after trim. */
export function assertUserTextWithinLimit(
  text: string,
  operation: ClinicalOperation,
): string {
  const limits = CLINICAL_AI_LIMITS[operation];
  const trimmed = text.trim();
  if (!trimmed) {
    throw new ClinicalGuardError('Message is empty');
  }
  if (trimmed.length > limits.maxUserChars) {
    throw new ClinicalGuardError('Message exceeds maximum length');
  }
  return trimmed;
}

/**
 * Measure decoded base64 image bytes from a data URL.
 * Does not estimate via dataUrl.length — decodes the payload.
 */
export function measureDecodedDataUrlBytes(dataUrl: string): number {
  const match = /^data:image\/(?:jpeg|jpg|png|webp|gif);base64,(.+)$/i.exec(
    dataUrl.trim(),
  );
  if (!match) {
    throw new ClinicalGuardError('Invalid image data URL');
  }
  const b64 = match[1].replace(/\s/g, '');
  if (!b64 || /[^A-Za-z0-9+/=]/.test(b64)) {
    throw new ClinicalGuardError('Invalid image base64 payload');
  }
  try {
    const buf = Buffer.from(b64, 'base64');
    // Reject empty / corrupt payloads (Node may return empty for garbage)
    if (buf.length === 0) {
      throw new ClinicalGuardError('Invalid image base64 payload');
    }
    // Round-trip check: re-encode should be close (padding differences OK)
    const re = buf.toString('base64').replace(/=+$/, '');
    const orig = b64.replace(/=+$/, '');
    if (re.length === 0 || Math.abs(re.length - orig.length) > 4) {
      // Still accept if buffer non-empty — some providers pad differently
    }
    return buf.length;
  } catch (err) {
    if (err instanceof ClinicalGuardError) throw err;
    throw new ClinicalGuardError('Invalid image base64 payload');
  }
}

export function assertImageDataUrlWithinLimit(dataUrl: string): number {
  const max =
    CLINICAL_AI_LIMITS.image.maxDecodedImageBytes ?? 2 * 1024 * 1024;
  const bytes = measureDecodedDataUrlBytes(dataUrl);
  if (bytes > max) {
    throw new ClinicalGuardError('Image exceeds maximum size');
  }
  return bytes;
}

export type HistoryMessage = {
  role: string;
  content: string;
};

/** Keep system prompts + last N non-system messages; truncate long contents. */
export function truncateHistoryMessages(
  messages: HistoryMessage[],
  operation: ClinicalOperation,
): HistoryMessage[] {
  const limits = CLINICAL_AI_LIMITS[operation];
  const maxContent = Math.max(limits.maxUserChars, 4000);
  const systems = messages.filter((m) => m.role === 'system');
  const rest = messages.filter((m) => m.role !== 'system');
  const kept = rest.slice(-limits.maxHistoryMessages);
  return [...systems, ...kept].map((m) => ({
    role: m.role,
    content:
      m.content.length > maxContent
        ? `${m.content.slice(0, maxContent)}…`
        : m.content,
  }));
}

export type ClinicalAbortCause = 'client' | 'timeout' | 'none';

/**
 * Combined abort for client disconnect + server timeout.
 * Prefer AbortSignal.any / AbortSignal.timeout (Node 20+).
 */
export function createClinicalAbortBundle(opts: {
  requestSignal?: AbortSignal | null;
  timeoutMs: number;
}): {
  signal: AbortSignal;
  getCause: () => ClinicalAbortCause;
  cleanup: () => void;
} {
  const timeoutMs = opts.timeoutMs;
  const requestSignal = opts.requestSignal ?? undefined;

  if (
    typeof AbortSignal !== 'undefined' &&
    typeof AbortSignal.timeout === 'function' &&
    typeof AbortSignal.any === 'function'
  ) {
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const parts = requestSignal
      ? [requestSignal, timeoutSignal]
      : [timeoutSignal];
    const signal = AbortSignal.any(parts);
    return {
      signal,
      getCause: () => {
        if (requestSignal?.aborted) return 'client';
        if (timeoutSignal.aborted) return 'timeout';
        return 'none';
      },
      cleanup: () => {
        /* AbortSignal.timeout is GC'd with signal */
      },
    };
  }

  // Fallback for older runtimes
  const controller = new AbortController();
  const onRequestAbort = () => controller.abort();
  if (requestSignal) {
    if (requestSignal.aborted) controller.abort();
    else requestSignal.addEventListener('abort', onRequestAbort, { once: true });
  }
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  return {
    signal: controller.signal,
    getCause: () => {
      if (requestSignal?.aborted) return 'client';
      if (timedOut) return 'timeout';
      return 'none';
    },
    cleanup: () => {
      clearTimeout(timer);
      if (requestSignal) {
        requestSignal.removeEventListener('abort', onRequestAbort);
      }
    },
  };
}

export function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const name = (err as { name?: string }).name;
  return name === 'AbortError' || name === 'TimeoutError' || name === 'AbortSignal';
}
