-- 1. Trigger-only functions should not be callable via the API at all
REVOKE EXECUTE ON FUNCTION public.notify_admins_of_bug_report() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_content_report() FROM anon, authenticated, public;

-- 2. Public read helpers do not need to bypass RLS: switch to SECURITY INVOKER
ALTER FUNCTION public.build_peak_list(text, integer, integer, text, integer) SECURITY INVOKER;
ALTER FUNCTION public.peak_ascent_registry(text, integer) SECURITY INVOKER;
ALTER FUNCTION public.world_peak_countries() SECURITY INVOKER;

-- world_peak_countries reads aggregated public counts; allow the read as invoker
GRANT SELECT ON public.world_peak_country_counts TO anon, authenticated;

-- 3. wall-media: restrict reads to the owning member's folder (sharing uses signed URLs)
DROP POLICY IF EXISTS "Members can read wall media" ON storage.objects;
CREATE POLICY "Members can read own wall media"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'wall-media'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);
