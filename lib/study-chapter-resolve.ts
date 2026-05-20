import type { StudyChapterTarget } from '@/lib/quizToStudyChapter';
import { getParentStudyChapter } from '@/lib/quizToStudyChapter';
import { STUDY_PILOT_MODULE_ID } from '@/constants/study';
import {
  canAccessChapterSummary,
  isStudyFreePreviewChapter,
} from '@/constants/study';
import {
  getLocalPreviewChapter,
  resolveStudyModuleId,
} from '@/lib/study-preview';
import { getFullBundleChapter } from '@/lib/study-full-bundle';
import { resolveStudyChapterAudioUrl } from '@/lib/study-audio-url';

export type ResolvedStudyContent = {
  source: 'api' | 'bundle' | 'local' | 'none';
  locked: boolean;
  notFound?: boolean;
  title: string | null;
  summaryMarkdown?: string;
  summaryVersion?: number;
  audioUrl?: string | null;
  audioDurationSec?: number | null;
  isFreePreview?: boolean;
  hasAudio?: boolean;
  isTopicSummary?: boolean;
  isFallbackToParent?: boolean;
  parentChapter?: StudyChapterTarget | null;
  requestedModuleId?: string;
  requestedChapterId?: string;
};

type ChapterRow = {
  found: boolean;
  locked?: boolean;
  title?: string | null;
  summaryMarkdown?: string;
  summaryVersion?: number;
  audioUrl?: string | null;
  audioDurationSec?: number | null;
  isFreePreview?: boolean;
  hasAudio?: boolean;
};

function resolveFromLocalSources(params: {
  moduleId: string;
  chapterId: string;
  locale: 'ro' | 'en';
  isPremium: boolean;
}): Omit<ResolvedStudyContent, 'isTopicSummary' | 'isFallbackToParent' | 'parentChapter' | 'requestedModuleId' | 'requestedChapterId'> | null {
  const { moduleId, chapterId, locale, isPremium } = params;
  const effectiveModuleId = resolveStudyModuleId(moduleId, chapterId);
  const canAccess = canAccessChapterSummary(chapterId, isPremium, effectiveModuleId);

  const resolveAudio = (stored: string | null | undefined) =>
    resolveStudyChapterAudioUrl({
      audioUrl: stored,
      moduleId: effectiveModuleId,
      chapterId,
      locale,
    });

  const fullBundle = isPremium
    ? getFullBundleChapter(effectiveModuleId, chapterId, locale)
    : null;
  const localPreview = getLocalPreviewChapter(effectiveModuleId, chapterId, locale);

  if (canAccess && fullBundle) {
    return {
      source: 'bundle',
      locked: false,
      title: fullBundle.title,
      summaryMarkdown: fullBundle.summaryMarkdown,
      summaryVersion: fullBundle.summaryVersion,
      audioUrl: resolveAudio(fullBundle.audioUrl),
      audioDurationSec: fullBundle.audioDurationSec,
      isFreePreview: isStudyFreePreviewChapter(chapterId, effectiveModuleId),
    };
  }

  if (canAccess && localPreview) {
    return {
      source: 'local',
      locked: false,
      title: localPreview.title,
      summaryMarkdown: localPreview.summaryMarkdown,
      summaryVersion: localPreview.summaryVersion,
      audioUrl: resolveAudio(localPreview.audioUrl),
      audioDurationSec: localPreview.audioDurationSec,
      isFreePreview: true,
    };
  }

  if (!canAccess && localPreview === null && fullBundle === null) {
    return {
      source: 'none',
      locked: true,
      title: null,
      isFreePreview: isStudyFreePreviewChapter(chapterId, effectiveModuleId),
    };
  }

  if (!canAccess) {
    return {
      source: 'none',
      locked: true,
      title: null,
      isFreePreview: isStudyFreePreviewChapter(chapterId, effectiveModuleId),
    };
  }

  return null;
}

export function resolveStudyChapterContent(params: {
  moduleId: string;
  chapterId: string;
  locale: 'ro' | 'en';
  isPremium: boolean;
  apiData?: ChapterRow | null;
}): ResolvedStudyContent {
  const { moduleId, chapterId, locale, isPremium, apiData } = params;
  const parentChapter = getParentStudyChapter(moduleId, chapterId);

  const resolveAudio = (modId: string, chId: string, stored: string | null | undefined) =>
    resolveStudyChapterAudioUrl({
      audioUrl: stored,
      moduleId: modId,
      chapterId: chId,
      locale,
    });

  if (apiData?.found && !apiData.locked && apiData.summaryMarkdown) {
    const effectiveModuleId = resolveStudyModuleId(moduleId, chapterId);
    return {
      source: 'api',
      locked: false,
      title: apiData.title ?? null,
      summaryMarkdown: apiData.summaryMarkdown,
      summaryVersion: apiData.summaryVersion,
      audioUrl: resolveAudio(effectiveModuleId, chapterId, apiData.audioUrl),
      audioDurationSec: apiData.audioDurationSec,
      isFreePreview: apiData.isFreePreview,
      isTopicSummary: moduleId !== STUDY_PILOT_MODULE_ID,
      isFallbackToParent: false,
      parentChapter,
      requestedModuleId: moduleId,
      requestedChapterId: chapterId,
    };
  }

  const granularLocal = resolveFromLocalSources({
    moduleId,
    chapterId,
    locale,
    isPremium,
  });

  if (granularLocal?.summaryMarkdown) {
    return {
      ...granularLocal,
      isTopicSummary: moduleId !== STUDY_PILOT_MODULE_ID,
      isFallbackToParent: false,
      parentChapter,
      requestedModuleId: moduleId,
      requestedChapterId: chapterId,
    };
  }

  if (parentChapter && moduleId !== STUDY_PILOT_MODULE_ID) {
    const parentLocal = resolveFromLocalSources({
      moduleId: parentChapter.studyModuleId,
      chapterId: parentChapter.studyChapterId,
      locale,
      isPremium,
    });

    if (parentLocal?.summaryMarkdown) {
      return {
        ...parentLocal,
        isTopicSummary: false,
        isFallbackToParent: true,
        parentChapter,
        requestedModuleId: moduleId,
        requestedChapterId: chapterId,
      };
    }
  }

  if (apiData?.found && apiData.locked) {
    return {
      source: 'api',
      locked: true,
      title: apiData.title ?? null,
      isFreePreview: apiData.isFreePreview,
      hasAudio: apiData.hasAudio,
      parentChapter,
      requestedModuleId: moduleId,
      requestedChapterId: chapterId,
    };
  }

  if (granularLocal?.locked) {
    return {
      ...granularLocal,
      parentChapter,
      requestedModuleId: moduleId,
      requestedChapterId: chapterId,
    };
  }

  return {
    source: 'none',
    locked: false,
    notFound: true,
    title: null,
    parentChapter,
    requestedModuleId: moduleId,
    requestedChapterId: chapterId,
  };
}
