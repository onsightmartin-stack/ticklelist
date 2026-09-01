CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

CREATE TABLE public.world_peaks (
  id bigint PRIMARY KEY,
  name text NOT NULL,
  lat double precision,
  lon double precision,
  feature_code text,
  country_code text,
  admin1 text,
  elevation integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.world_peaks TO anon;
GRANT SELECT ON public.world_peaks TO authenticated;
GRANT ALL ON public.world_peaks TO service_role;

ALTER TABLE public.world_peaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "World peaks are publicly readable"
  ON public.world_peaks FOR SELECT
  USING (true);

CREATE INDEX world_peaks_name_trgm_idx ON public.world_peaks USING gin (name public.gin_trgm_ops);
CREATE INDEX world_peaks_name_lower_idx ON public.world_peaks (lower(name) text_pattern_ops);
CREATE INDEX world_peaks_country_idx ON public.world_peaks (country_code);
CREATE INDEX world_peaks_elevation_idx ON public.world_peaks (elevation DESC NULLS LAST);

CREATE OR REPLACE FUNCTION public.search_world_peaks(_q text, _limit integer DEFAULT 20, _country text DEFAULT NULL, _min_elevation integer DEFAULT NULL)
RETURNS TABLE(id bigint, name text, lat double precision, lon double precision, feature_code text, country_code text, admin1 text, elevation integer)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT p.id, p.name, p.lat, p.lon, p.feature_code, p.country_code, p.admin1, p.elevation
  FROM public.world_peaks p
  WHERE length(coalesce(_q, '')) >= 2
    AND (p.name ILIKE _q || '%' OR p.name % _q)
    AND (_country IS NULL OR p.country_code = _country)
    AND (_min_elevation IS NULL OR p.elevation >= _min_elevation)
  ORDER BY (p.name ILIKE _q || '%') DESC,
           public.similarity(p.name, _q) DESC,
           p.elevation DESC NULLS LAST
  LIMIT LEAST(GREATEST(coalesce(_limit, 20), 1), 50);
$$;

REVOKE EXECUTE ON FUNCTION public.search_world_peaks(text, integer, text, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.search_world_peaks(text, integer, text, integer) TO anon, authenticated, service_role;