CREATE OR REPLACE FUNCTION public.world_peak_countries()
RETURNS TABLE (country_code text, peaks bigint)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT p.country_code, count(*)::bigint
  FROM public.world_peaks p
  WHERE p.country_code IS NOT NULL
  GROUP BY p.country_code
  HAVING count(*) > 10
  ORDER BY p.country_code;
$$;

GRANT EXECUTE ON FUNCTION public.world_peak_countries() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.build_peak_list(
  _country text DEFAULT NULL,
  _min_elevation integer DEFAULT NULL,
  _min_prominence integer DEFAULT NULL,
  _sort text DEFAULT 'elevation',
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
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH matched AS (
    SELECT p.id, p.name, p.lat, p.lon, p.country_code, p.admin1, p.elevation, p.prominence
    FROM public.world_peaks p
    WHERE (_country IS NULL OR p.country_code = _country)
      AND (_min_elevation IS NULL OR p.elevation >= _min_elevation)
      AND (_min_prominence IS NULL OR p.prominence >= _min_prominence)
      AND (_sort <> 'prominence' OR p.prominence IS NOT NULL)
      AND p.elevation IS NOT NULL
  )
  SELECT m.*, (SELECT count(*) FROM matched)::bigint AS total_matches
  FROM matched m
  ORDER BY
    CASE WHEN _sort = 'prominence' THEN m.prominence ELSE m.elevation END DESC NULLS LAST,
    m.name
  LIMIT LEAST(GREATEST(COALESCE(_limit, 50), 1), 300);
$$;

GRANT EXECUTE ON FUNCTION public.build_peak_list(text, integer, integer, text, integer) TO anon, authenticated, service_role;