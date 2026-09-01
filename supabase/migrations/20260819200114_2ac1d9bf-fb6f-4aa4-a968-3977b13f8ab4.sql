CREATE TABLE IF NOT EXISTS public.peakbagger_peaks (
  pid text PRIMARY KEY,
  name text NOT NULL,
  elevation numeric NOT NULL,
  prominence numeric,
  location text,
  range text,
  world_peak_id bigint REFERENCES public.world_peaks(id) ON DELETE SET NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS peakbagger_peaks_name_idx ON public.peakbagger_peaks (lower(name));
CREATE INDEX IF NOT EXISTS peakbagger_peaks_world_peak_idx ON public.peakbagger_peaks (world_peak_id);

GRANT SELECT ON public.peakbagger_peaks TO anon;
GRANT SELECT ON public.peakbagger_peaks TO authenticated;
GRANT ALL ON public.peakbagger_peaks TO service_role;

ALTER TABLE public.peakbagger_peaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Peakbagger reference data is public" ON public.peakbagger_peaks FOR SELECT USING (true);