-- Keep the aggregate counts out of the public API surface
REVOKE SELECT ON public.world_peak_country_counts FROM anon, authenticated;

-- Only signed-in members (list builder) need country counts
ALTER FUNCTION public.world_peak_countries() SECURITY DEFINER;
ALTER FUNCTION public.world_peak_countries() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.world_peak_countries() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.world_peak_countries() TO authenticated;
