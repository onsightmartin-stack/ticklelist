ALTER TABLE public.world_peaks
  ADD COLUMN IF NOT EXISTS first_ascent_date text,
  ADD COLUMN IF NOT EXISTS first_ascent_by text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS peakbagger_id text;

GRANT SELECT ON public.world_peaks TO anon;
GRANT SELECT, INSERT ON public.world_peaks TO authenticated;
GRANT ALL ON public.world_peaks TO service_role;

CREATE POLICY "Members can add peaks"
ON public.world_peaks
FOR INSERT
TO authenticated
WITH CHECK (added_by = auth.uid());