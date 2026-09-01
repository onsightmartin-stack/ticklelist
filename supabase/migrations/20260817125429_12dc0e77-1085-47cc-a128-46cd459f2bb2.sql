CREATE INDEX IF NOT EXISTS world_peaks_country_elevation_idx ON public.world_peaks (country_code, elevation DESC NULLS LAST);

CREATE MATERIALIZED VIEW IF NOT EXISTS public.world_peak_country_counts AS
  SELECT country_code, count(*)::bigint AS peaks
  FROM public.world_peaks
  WHERE country_code IS NOT NULL
  GROUP BY country_code
  HAVING count(*) > 10;

CREATE UNIQUE INDEX IF NOT EXISTS world_peak_country_counts_idx ON public.world_peak_country_counts (country_code);

CREATE OR REPLACE FUNCTION public.world_peak_countries()
RETURNS TABLE (country_code text, peaks bigint)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT c.country_code, c.peaks FROM public.world_peak_country_counts c ORDER BY c.country_code;
$$;

REVOKE ALL ON FUNCTION public.world_peak_countries() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.world_peak_countries() TO anon, authenticated, service_role;