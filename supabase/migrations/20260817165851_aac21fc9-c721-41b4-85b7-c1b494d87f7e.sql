CREATE MATERIALIZED VIEW IF NOT EXISTS public.world_peak_country_stats AS
SELECT country_code,
       count(*)::bigint AS peak_count,
       max(elevation)::int AS max_elevation
FROM public.world_peaks
WHERE country_code IS NOT NULL AND country_code <> ''
GROUP BY country_code;

CREATE UNIQUE INDEX IF NOT EXISTS world_peak_country_stats_pk ON public.world_peak_country_stats (country_code);

GRANT SELECT ON public.world_peak_country_stats TO anon, authenticated;
GRANT ALL ON public.world_peak_country_stats TO service_role;