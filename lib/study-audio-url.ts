import { getMergedExpoExtra } from '@/lib/expo-public-extra';
import { STUDY_PILOT_MODULE_ID } from '@/constants/study';

/** Public Supabase Storage URL for a chapter MP3 (if uploaded). */
export function getStudyAudioPublicUrl(
  moduleId: string,
  chapterId: string,
  locale: 'ro' | 'en',
): string | null {
  if (moduleId !== STUDY_PILOT_MODULE_ID) return null;
  const rawBase = getMergedExpoExtra().EXPO_PUBLIC_SUPABASE_URL;
  const base = typeof rawBase === 'string' ? rawBase.trim() : '';
  if (!base) return null;
  return `${base.replace(/\/$/, '')}/storage/v1/object/public/study-audio/${moduleId}/${chapterId}-${locale}.mp3`;
}

export function resolveStudyChapterAudioUrl(params: {
  audioUrl?: string | null;
  moduleId: string;
  chapterId: string;
  locale: 'ro' | 'en';
}): string | null {
  const fromApi = params.audioUrl?.trim();
  if (fromApi) return fromApi;
  return getStudyAudioPublicUrl(params.moduleId, params.chapterId, params.locale);
}
