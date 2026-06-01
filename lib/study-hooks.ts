import { useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { getChaptersForModule } from '@/mocks/chapters';
import {
  STUDY_MODULE_IDS,
  canAccessChapterSummary,
  isStudyFreePreviewChapter,
} from '@/constants/study';
import {
  getLocalPreviewChapter,
  listLocalPreviewChapterIds,
  resolveStudyModuleId,
} from '@/lib/study-preview';
import { listFullBundleChapterIds } from '@/lib/study-full-bundle';
import { resolveStudyChapterContent } from '@/lib/study-chapter-resolve';
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
      const isFreePreview = isStudyFreePreviewChapter(ch.id, moduleId);
      const hasSummary =
        Boolean(api?.hasSummary) || hasLocalPreview || hasPremiumBundle || isFreePreview;
      const canAccessThis = canAccessChapterSummary(ch.id, isPremium, moduleId);
      const localPreview = hasLocalPreview
        ? getLocalPreviewChapter(moduleId, ch.id, locale)
        : null;

      return {
        chapterId: ch.id,
        title: api?.title ?? localPreview?.title ?? getChapterTitle(ch.id),
        questionCount: ch.questions.length,
        hasSummary,
        hasAudio: Boolean(api?.hasAudio) || Boolean(localPreview?.audioUrl),
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

  const canAccess = canAccessChapterSummary(chapterId, isPremium, effectiveModuleId);

  const content = useMemo(
    () =>
      resolveStudyChapterContent({
        moduleId,
        chapterId,
        locale,
        isPremium,
        apiData: apiQuery.data,
      }),
    [moduleId, chapterId, locale, isPremium, apiQuery.data],
  );

  return { ...apiQuery, content, canAccess };
}
