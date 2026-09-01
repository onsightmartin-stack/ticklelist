DROP POLICY IF EXISTS "YouTube climbs are publicly readable" ON public.youtube_climbs;

CREATE POLICY "Confirmed youtube climbs are publicly readable"
ON public.youtube_climbs
FOR SELECT
TO anon, authenticated
USING (status = 'confirmed');