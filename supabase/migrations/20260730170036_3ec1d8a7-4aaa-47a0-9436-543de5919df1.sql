-- 1. Remove public read access to location_updates
DROP POLICY IF EXISTS "Anyone can read location updates" ON public.location_updates;
REVOKE ALL ON public.location_updates FROM anon, authenticated;
GRANT ALL ON public.location_updates TO service_role;

-- 2. Revoke public execute on SECURITY DEFINER function
REVOKE EXECUTE ON FUNCTION public.increment_visitor_count() FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_visitor_count() TO service_role;

-- 3. Visitor counter table: keep it out of the public Data API too
DROP POLICY IF EXISTS "Visitor counter is publicly readable" ON public.visitor_counter;
REVOKE ALL ON public.visitor_counter FROM anon, authenticated;
GRANT ALL ON public.visitor_counter TO service_role;