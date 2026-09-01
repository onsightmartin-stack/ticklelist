CREATE OR REPLACE FUNCTION public.apply_peak_metrics(_rows jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n integer;
BEGIN
  WITH src AS (
    SELECT (r->>'id')::bigint AS id,
           NULLIF(r->>'prominence','')::int AS prominence,
           NULLIF(r->>'saddle_lat','')::double precision AS saddle_lat,
           NULLIF(r->>'saddle_lon','')::double precision AS saddle_lon,
           NULLIF(r->>'dem_elevation','')::int AS dem_elevation,
           NULLIF(r->>'isolation_km','')::double precision AS isolation_km
    FROM jsonb_array_elements(_rows) r
  ), upd AS (
    UPDATE public.world_peaks w SET
      prominence = COALESCE(w.prominence, s.prominence),
      saddle_lat = COALESCE(s.saddle_lat, w.saddle_lat),
      saddle_lon = COALESCE(s.saddle_lon, w.saddle_lon),
      dem_elevation = COALESCE(s.dem_elevation, w.dem_elevation),
      isolation_km = COALESCE(s.isolation_km, w.isolation_km),
      prominence_source = COALESCE(w.prominence_source, 'kirmse-p100')
    FROM src s WHERE s.id = w.id
    RETURNING 1
  )
  SELECT count(*) INTO n FROM upd;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_peak_metrics(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_peak_metrics(jsonb) TO service_role;