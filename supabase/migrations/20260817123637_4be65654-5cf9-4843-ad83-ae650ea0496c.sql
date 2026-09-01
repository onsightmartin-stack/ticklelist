ALTER TABLE public.world_peaks
  ADD COLUMN IF NOT EXISTS saddle_lat double precision,
  ADD COLUMN IF NOT EXISTS saddle_lon double precision,
  ADD COLUMN IF NOT EXISTS isolation_km double precision,
  ADD COLUMN IF NOT EXISTS dem_elevation integer,
  ADD COLUMN IF NOT EXISTS prominence_source text;

CREATE INDEX IF NOT EXISTS world_peaks_prominence_idx ON public.world_peaks (prominence DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS world_peaks_country_prominence_idx ON public.world_peaks (country_code, prominence DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS world_peaks_isolation_idx ON public.world_peaks (isolation_km DESC NULLS LAST);