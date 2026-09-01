ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS media_type text;

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_media_type_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_media_type_check
  CHECK (media_type IS NULL OR media_type IN ('image','video','youtube'));

DROP POLICY IF EXISTS "Members can upload own wall media" ON storage.objects;
CREATE POLICY "Members can upload own wall media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'wall-media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Members can read wall media" ON storage.objects;
CREATE POLICY "Members can read wall media"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'wall-media');

DROP POLICY IF EXISTS "Members can delete own wall media" ON storage.objects;
CREATE POLICY "Members can delete own wall media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'wall-media' AND (storage.foldername(name))[1] = auth.uid()::text);