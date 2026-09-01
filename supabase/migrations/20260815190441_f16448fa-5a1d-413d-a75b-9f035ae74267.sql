CREATE OR REPLACE FUNCTION public.search_world_peaks(
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
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $function$
DECLARE
  n text := public.peak_norm(coalesce(_q, ''));
BEGIN
  IF length(n) < 2 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT p.id, p.name, p.lat, p.lon, p.feature_code, p.country_code, p.admin1, p.elevation, p.prominence
  FROM public.world_peaks p
  WHERE (
      public.peak_norm(p.name) LIKE n || '%'
      OR n OPERATOR(public.<%) public.peak_norm(p.name)
    )
    AND (_country IS NULL OR p.country_code = _country)
    AND (_min_elevation IS NULL OR p.elevation >= _min_elevation)
    AND (_min_prominence IS NULL OR p.prominence >= _min_prominence)
  ORDER BY
    (public.peak_norm(p.name) = n) DESC,
    (public.peak_norm(p.name) LIKE n || '%') DESC,
    CASE p.feature_code
      WHEN 'PK' THEN 0
      WHEN 'VLC' THEN 0
      WHEN 'MT' THEN 1
      WHEN 'MTS' THEN 2
      WHEN 'HLL' THEN 3
      WHEN 'HLLS' THEN 3
      ELSE 4
    END,
    public.similarity(public.peak_norm(p.name), n) DESC,
    p.elevation DESC NULLS LAST
  LIMIT LEAST(GREATEST(coalesce(_limit, 20), 1), 50);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.search_world_peaks(text, integer, text, integer, integer) TO anon, authenticated;