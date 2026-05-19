import { Platform } from 'react-native';
import * as Speech from 'expo-speech';
import { log } from '@/lib/log';

const MAX_CHUNK_CHARS = 3200;
const SPEAK_DELAY_MS = 120;

/** Plain text suitable for device TTS (markdown stripped). */
export function stripMarkdownForSpeech(markdown: string): string {
  return markdown
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^[-•]\s+/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[#*_`]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n /g, '\n')
    .trim();
}

/** Split long summaries at sentence boundaries for platform TTS limits. */
export function chunkTextForSpeech(text: string, maxLen = MAX_CHUNK_CHARS): string[] {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  let rest = text;

  while (rest.length > maxLen) {
    let cut = rest.lastIndexOf('. ', maxLen);
    if (cut < maxLen * 0.4) {
      cut = rest.lastIndexOf(' ', maxLen);
    }
    if (cut < 1) cut = maxLen;
    chunks.push(rest.slice(0, cut + 1).trim());
    rest = rest.slice(cut + 1).trim();
  }

  if (rest.length > 0) chunks.push(rest);
  return chunks.length > 0 ? chunks : [text];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** No native audio module required — TTS uses the system speech engine. */
export async function prepareAudioModeForPlayback(): Promise<void> {
  return;
}

export type StudySpeechSession = {
  stop: () => void;
};

/**
 * Speak study summary via on-device TTS. Chunks long text; stops when `stop()` is called.
 */
export function startStudySpeech(
  markdown: string,
  locale: 'ro' | 'en',
  onPlayingChange: (playing: boolean) => void,
): StudySpeechSession {
  let stopped = false;
  const plain = stripMarkdownForSpeech(markdown);
  if (!plain) {
    onPlayingChange(false);
    return { stop: () => {} };
  }

  const chunks = chunkTextForSpeech(plain);
  let chunkIndex = 0;
  let triedDefaultLocale = false;
  let startedPlayback = false;

  const stop = () => {
    stopped = true;
    chunkIndex = chunks.length;
    Speech.stop();
    onPlayingChange(false);
  };

  const primaryLang = locale === 'ro' ? 'ro-RO' : 'en-US';
  const speechRate = Platform.OS === 'ios' ? 0.52 : 1.0;

  const speakChunk = (lang: string | undefined) => {
    if (stopped || chunkIndex >= chunks.length) {
      onPlayingChange(false);
      return;
    }

    const chunk = chunks[chunkIndex]!;
    const options: Speech.SpeechOptions = {
      rate: speechRate,
      onStart: () => {
        if (!startedPlayback) {
          startedPlayback = true;
          onPlayingChange(true);
        }
      },
      onDone: () => {
        if (stopped) return;
        chunkIndex += 1;
        if (chunkIndex >= chunks.length) {
          onPlayingChange(false);
          return;
        }
        speakChunk(lang);
      },
      onStopped: () => {
        if (stopped) return;
        onPlayingChange(false);
      },
      onError: (err) => {
        log.warn('[StudySpeech] TTS chunk error:', err);
        if (!triedDefaultLocale && lang === primaryLang) {
          triedDefaultLocale = true;
          speakChunk(undefined);
          return;
        }
        if (stopped) return;
        chunkIndex += 1;
        if (chunkIndex >= chunks.length) {
          onPlayingChange(false);
          return;
        }
        speakChunk(lang);
      },
    };
    if (lang) options.language = lang;

    Speech.speak(chunk, options);
  };

  void (async () => {
    await delay(SPEAK_DELAY_MS);
    if (stopped) return;
    Speech.stop();
    await delay(40);
    if (stopped) return;
    speakChunk(primaryLang);
    await delay(400);
    if (stopped) return;
    if (!startedPlayback) {
      const speaking = await Speech.isSpeakingAsync();
      if (speaking && !stopped) {
        startedPlayback = true;
        onPlayingChange(true);
      }
    }
  })();

  return { stop };
}

export async function stopStudySpeech(): Promise<void> {
  Speech.stop();
}
