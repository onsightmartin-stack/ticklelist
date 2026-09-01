ALTER TABLE public.peakbagger_peaks
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lon double precision,
  ADD COLUMN IF NOT EXISTS coords_source text,
  ADD COLUMN IF NOT EXISTS coords_checked_at timestamptz;

-- Backfill 1: peaks already linked to a world peak by Peakbagger id
UPDATE public.peakbagger_peaks p
SET lat = w.lat, lon = w.lon, coords_source = 'world_peaks:pid', coords_checked_at = now()
FROM public.world_peaks w
WHERE w.peakbagger_id = p.pid AND p.lat IS NULL AND w.lat IS NOT NULL;

-- Backfill 2: name + elevation match (within 15 m)
UPDATE public.peakbagger_peaks p
SET lat = m.lat, lon = m.lon, coords_source = 'world_peaks:name', coords_checked_at = now()
FROM (
  SELECT DISTINCT ON (p2.pid) p2.pid, w.lat, w.lon
  FROM public.peakbagger_peaks p2
  JOIN public.world_peaks w
    ON lower(w.name) = lower(p2.name)
   AND abs(coalesce(w.elevation, 0) - coalesce(p2.elevation, 0)) <= 15
  WHERE p2.lat IS NULL AND w.lat IS NOT NULL
  ORDER BY p2.pid, abs(coalesce(w.elevation, 0) - coalesce(p2.elevation, 0))
) m
WHERE m.pid = p.pid AND p.lat IS NULL;

CREATE INDEX IF NOT EXISTS peakbagger_peaks_missing_coords_idx
  ON public.peakbagger_peaks (coords_checked_at NULLS FIRST)
  WHERE lat IS NULL;