-- Chapter study summaries (text + optional audio metadata)
CREATE TABLE IF NOT EXISTS public.chapter_study_content (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  module_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'ro',
  title TEXT,
  summary_markdown TEXT NOT NULL,
  summary_version INTEGER NOT NULL DEFAULT 1,
  audio_url TEXT,
  audio_duration_sec INTEGER,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'review', 'published')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (module_id, chapter_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_chapter_study_content_module_locale
  ON public.chapter_study_content (module_id, locale);

CREATE INDEX IF NOT EXISTS idx_chapter_study_content_published
  ON public.chapter_study_content (module_id, locale, status)
  WHERE status = 'published';

ALTER TABLE public.chapter_study_content ENABLE ROW LEVEL SECURITY;

-- Anyone can read published summaries (app enforces Premium for non-preview chapters)
CREATE POLICY "Published chapter summaries are readable"
  ON public.chapter_study_content
  FOR SELECT
  USING (status = 'published');

-- Service role / migrations handle writes; no client INSERT/UPDATE policies

CREATE OR REPLACE FUNCTION public.touch_chapter_study_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.status = 'published' AND OLD.status IS DISTINCT FROM 'published' THEN
    NEW.published_at = COALESCE(NEW.published_at, NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS chapter_study_content_updated_at ON public.chapter_study_content;
CREATE TRIGGER chapter_study_content_updated_at
  BEFORE UPDATE ON public.chapter_study_content
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_chapter_study_content_updated_at();
