CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;

CREATE OR REPLACE FUNCTION public.peak_norm(_t text)
RETURNS text
LANGUAGE sql
IMMUTABLE
STRICT
PARALLEL SAFE
SET search_path TO 'public'
AS $$ SELECT lower(public.unaccent('public.unaccent', _t)) $$;

REVOKE ALL ON FUNCTION public.peak_norm(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.peak_norm(text) TO anon, authenticated, service_role;

CREATE INDEX IF NOT EXISTS world_peaks_name_norm_trgm_idx
  ON public.world_peaks USING gin (public.peak_norm(name) public.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS world_peaks_name_norm_prefix_idx
  ON public.world_peaks (public.peak_norm(name) text_pattern_ops);

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
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  WITH q AS (
    SELECT public.peak_norm(coalesce(_q, '')) AS n
  )
  SELECT p.id, p.name, p.lat, p.lon, p.feature_code, p.country_code, p.admin1, p.elevation, p.prominence
  FROM public.world_peaks p, q
  WHERE length(q.n) >= 2
    AND (
      public.peak_norm(p.name) LIKE q.n || '%'
      OR public.peak_norm(p.name) % q.n
      OR public.word_similarity(q.n, public.peak_norm(p.name)) > 0.6
    )
    AND (_country IS NULL OR p.country_code = _country)
    AND (_min_elevation IS NULL OR p.elevation >= _min_elevation)
    AND (_min_prominence IS NULL OR p.prominence >= _min_prominence)
  ORDER BY
    (public.peak_norm(p.name) = q.n) DESC,
    (public.peak_norm(p.name) LIKE q.n || '%') DESC,
    CASE p.feature_code
      WHEN 'PK' THEN 0
      WHEN 'VLC' THEN 0
      WHEN 'MT' THEN 1
      WHEN 'MTS' THEN 2
      WHEN 'HLL' THEN 3
      WHEN 'HLLS' THEN 3
      ELSE 4
    END,
    public.similarity(public.peak_norm(p.name), q.n) DESC,
    p.elevation DESC NULLS LAST
  LIMIT LEAST(GREATEST(coalesce(_limit, 20), 1), 50);
$function$;

GRANT EXECUTE ON FUNCTION public.search_world_peaks(text, integer, text, integer, integer) TO anon, authenticated;