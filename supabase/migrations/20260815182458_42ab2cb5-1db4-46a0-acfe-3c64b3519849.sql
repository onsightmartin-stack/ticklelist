DROP FUNCTION IF EXISTS public.search_world_peaks(text, integer, text, integer);

CREATE FUNCTION public.search_world_peaks(
  _q text,
  _limit integer DEFAULT 20,
  _country text DEFAULT NULL,
  _min_elevation integer DEFAULT NULL,
  _min_prominence integer DEFAULT NULL
)
RETURNS TABLE(
  id bigint,
  name text,
  lat double precision,
  lon double precision,
  feature_code text,
  country_code text,
  admin1 text,
  elevation integer,
  prominence integer
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT p.id, p.name, p.lat, p.lon, p.feature_code, p.country_code, p.admin1, p.elevation, p.prominence
  FROM public.world_peaks p
  WHERE length(coalesce(_q, '')) >= 2
    AND (p.name ILIKE _q || '%' OR p.name % _q)
    AND (_country IS NULL OR p.country_code = _country)
    AND (_min_elevation IS NULL OR p.elevation >= _min_elevation)
    AND (_min_prominence IS NULL OR p.prominence >= _min_prominence)
  ORDER BY (p.name ILIKE _q || '%') DESC,
           public.similarity(p.name, _q) DESC,
           p.elevation DESC NULLS LAST
  LIMIT LEAST(GREATEST(coalesce(_limit, 20), 1), 50);
$function$;

GRANT EXECUTE ON FUNCTION public.search_world_peaks(text, integer, text, integer, integer) TO anon, authenticated;