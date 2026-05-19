import { useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { getChaptersForModule } from '@/mocks/chapters';
import {
  STUDY_MODULE_IDS,
  STUDY_PILOT_MODULE_ID,
  canAccessChapterSummary,
  isStudyFreePreviewChapter,
} from '@/constants/study';
import {
  getLocalPreviewChapter,
  listLocalPreviewChapterIds,
  resolveStudyModuleId,
} from '@/lib/study-preview';
import { getFullBundleChapter, listFullBundleChapterIds } from '@/lib/study-full-bundle';
import { resolveStudyChapterAudioUrl } from '@/lib/study-audio-url';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { useLanguage } from '@/providers/LanguageProvider';

export function useStudyModules(locale: 'ro' | 'en' = 'ro') {
  const query = trpc.study.listModules.useQuery({ locale });
  return query;
}

export function useStudyChapterList(moduleId: string, locale: 'ro' | 'en' = 'ro') {
  const { isPremium } = useSubscription();
  const { getChapterTitle } = useLanguage();
  const studyModuleEnabled = (STUDY_MODULE_IDS as readonly string[]).includes(
    moduleId,
  );
  const apiQuery = trpc.study.listChapters.useQuery(
    { moduleId, locale },
    { enabled: studyModuleEnabled },
  );

  const chapters = useMemo(() => {
    const catalog = getChaptersForModule(moduleId);
    const apiById = new Map((apiQuery.data ?? []).map((row) => [row.chapterId, row]));
    const previewIds = new Set(listLocalPreviewChapterIds(moduleId, locale));
    const premiumBundleIds = new Set(
      isPremium ? listFullBundleChapterIds(moduleId, locale) : [],
    );

    return catalog.map((ch) => {
      const api = apiById.get(ch.id);
      const hasLocalPreview = previewIds.has(ch.id);
      const hasPremiumBundle = premiumBundleIds.has(ch.id);
      const hasSummary = Boolean(api?.hasSummary) || hasLocalPreview || hasPremiumBundle;
      const isFreePreview = isStudyFreePreviewChapter(ch.id, moduleId);
      const canAccessThis = canAccessChapterSummary(ch.id, isPremium, moduleId);

      return {
        chapterId: ch.id,
        title: api?.title ?? getChapterTitle(ch.id),
        questionCount: ch.questions.length,
        hasSummary,
        hasAudio: Boolean(api?.hasAudio),
        isFreePreview,
        isLocked: hasSummary && !canAccessThis,
        comingSoon: !hasSummary,
      };
    });
  }, [moduleId, apiQuery.data, isPremium, getChapterTitle, locale]);

  return { ...apiQuery, chapters };
}

export function useStudyChapterContent(
  moduleId: string,
  chapterId: string,
  locale: 'ro' | 'en' = 'ro',
) {
  const { isPremium } = useSubscription();
  const effectiveModuleId = resolveStudyModuleId(moduleId, chapterId);
  const apiQuery = trpc.study.getChapter.useQuery({
    moduleId: effectiveModuleId,
    chapterId,
    locale,
  });

  const localPreview = getLocalPreviewChapter(effectiveModuleId, chapterId, locale);
  const fullBundle = isPremium
    ? getFullBundleChapter(effectiveModuleId, chapterId, locale)
    : null;
  const canAccess = canAccessChapterSummary(chapterId, isPremium, effectiveModuleId);

  const content = useMemo(() => {
    const resolveAudio = (stored: string | null | undefined) =>
      resolveStudyChapterAudioUrl({
        audioUrl: stored,
        moduleId: effectiveModuleId,
        chapterId,
        locale,
      });

    if (apiQuery.data?.found && !apiQuery.data.locked && 'summaryMarkdown' in apiQuery.data) {
      return {
        source: 'api' as const,
        locked: false,
        title: apiQuery.data.title,
        summaryMarkdown: apiQuery.data.summaryMarkdown,
        summaryVersion: apiQuery.data.summaryVersion,
        audioUrl: resolveAudio(apiQuery.data.audioUrl),
        audioDurationSec: apiQuery.data.audioDurationSec,
        isFreePreview: apiQuery.data.isFreePreview,
      };
    }

    if (canAccess && fullBundle) {
      return {
        source: 'bundle' as const,
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
        source: 'local' as const,
        locked: false,
        title: localPreview.title,
        summaryMarkdown: localPreview.summaryMarkdown,
        summaryVersion: localPreview.summaryVersion,
        audioUrl: resolveAudio(localPreview.audioUrl),
        audioDurationSec: localPreview.audioDurationSec,
        isFreePreview: true,
      };
    }

    if (apiQuery.data?.found && apiQuery.data.locked) {
      return {
        source: 'api' as const,
        locked: true,
        title: apiQuery.data.title,
        isFreePreview: apiQuery.data.isFreePreview,
        hasAudio: apiQuery.data.hasAudio,
      };
    }

    if (!canAccess && localPreview === null && fullBundle === null && apiQuery.data?.found === false) {
      return { source: 'none' as const, locked: false, notFound: true };
    }

    if (!canAccess) {
      return {
        source: 'api' as const,
        locked: true,
        title: null,
        isFreePreview: isStudyFreePreviewChapter(chapterId, effectiveModuleId),
      };
    }

    return { source: 'none' as const, locked: false, notFound: true };
  }, [apiQuery.data, canAccess, localPreview, fullBundle, chapterId, effectiveModuleId, locale]);

  return { ...apiQuery, content, canAccess };
}
