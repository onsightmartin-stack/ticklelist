CREATE POLICY "Members can upload their ascent photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'ascent-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Members can update their ascent photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'ascent-photos' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'ascent-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Members can delete their ascent photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'ascent-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Members can read ascent photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'ascent-photos');