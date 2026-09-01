REVOKE ALL ON public.world_peak_country_counts FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.world_peak_countries()
RETURNS TABLE (country_code text, peaks bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.country_code, c.peaks FROM public.world_peak_country_counts c ORDER BY c.country_code;
$$;

REVOKE ALL ON FUNCTION public.world_peak_countries() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.world_peak_countries() TO anon, authenticated, service_role;