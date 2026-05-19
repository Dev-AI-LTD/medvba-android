-- Public bucket for pre-generated chapter summary audio (MP3)
INSERT INTO storage.buckets (id, name, public)
VALUES ('study-audio', 'study-audio', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Study audio is publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'study-audio');

-- Writes via service role only (no client upload policy)
