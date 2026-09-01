CREATE OR REPLACE FUNCTION public.build_peak_list(
  _country text DEFAULT NULL,
  _min_elevation integer DEFAULT NULL,
  _min_prominence integer DEFAULT NULL,
  _sort text DEFAULT 'prominence',
  _limit integer DEFAULT 50
)
RETURNS TABLE (
  id bigint,
  name text,
  lat double precision,
  lon double precision,
  country_code text,
  admin1 text,
  elevation integer,
  prominence integer,
  total_matches bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer := LEAST(GREATEST(COALESCE(_limit, 50), 1), 300);
  cap constant integer := 5000;
  cnt bigint;
BEGIN
  SELECT count(*) INTO cnt FROM (
    SELECT 1
    FROM public.world_peaks p
    WHERE (_country IS NULL OR p.country_code = _country)
      AND p.elevation IS NOT NULL
      AND (_min_elevation IS NULL OR p.elevation >= _min_elevation)
      AND (_min_prominence IS NULL OR p.prominence >= _min_prominence)
      AND (_sort <> 'prominence' OR p.prominence IS NOT NULL)
    LIMIT cap
  ) s;

  IF _sort = 'prominence' THEN
    RETURN QUERY
      SELECT p.id, p.name, p.lat, p.lon, p.country_code, p.admin1, p.elevation, p.prominence, cnt
      FROM public.world_peaks p
      WHERE (_country IS NULL OR p.country_code = _country)
        AND p.elevation IS NOT NULL
        AND p.prominence IS NOT NULL
        AND (_min_elevation IS NULL OR p.elevation >= _min_elevation)
        AND (_min_prominence IS NULL OR p.prominence >= _min_prominence)
      ORDER BY p.prominence DESC
      LIMIT n;
  ELSE
    RETURN QUERY
      SELECT p.id, p.name, p.lat, p.lon, p.country_code, p.admin1, p.elevation, p.prominence, cnt
      FROM public.world_peaks p
      WHERE (_country IS NULL OR p.country_code = _country)
        AND p.elevation IS NOT NULL
        AND (_min_elevation IS NULL OR p.elevation >= _min_elevation)
        AND (_min_prominence IS NULL OR p.prominence >= _min_prominence)
      ORDER BY p.elevation DESC
      LIMIT n;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.build_peak_list(text, integer, integer, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.build_peak_list(text, integer, integer, text, integer) TO anon, authenticated, service_role;