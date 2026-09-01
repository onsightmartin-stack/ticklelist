CREATE TABLE public.world_places (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  country_code TEXT,
  admin1 TEXT,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  category TEXT NOT NULL DEFAULT 'sightseeing',
  feature_code TEXT,
  source TEXT NOT NULL DEFAULT 'geonames',
  source_id TEXT,
  added_by UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX world_places_source_key ON public.world_places (source, source_id) WHERE source_id IS NOT NULL;
CREATE INDEX world_places_name_trgm ON public.world_places USING gin (public.peak_norm(name) public.gin_trgm_ops);
CREATE INDEX world_places_country_idx ON public.world_places (country_code);

GRANT SELECT ON public.world_places TO anon;
GRANT SELECT, INSERT ON public.world_places TO authenticated;
GRANT ALL ON public.world_places TO service_role;

ALTER TABLE public.world_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read world places"
  ON public.world_places FOR SELECT
  USING (true);

CREATE POLICY "Members can add world places"
  ON public.world_places FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = added_by);

CREATE OR REPLACE FUNCTION public.search_world_places(
  _q text,
  _limit integer DEFAULT 20,
  _country text DEFAULT NULL,
  _category text DEFAULT NULL
)
RETURNS TABLE(id bigint, name text, lat double precision, lon double precision, category text, feature_code text, country_code text, admin1 text)
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
  SELECT p.id, p.name, p.lat, p.lon, p.category, p.feature_code, p.country_code, p.admin1
  FROM public.world_places p
  WHERE (
      public.peak_norm(p.name) LIKE n || '%'
      OR n OPERATOR(public.<%) public.peak_norm(p.name)
    )
    AND (_country IS NULL OR p.country_code = _country)
    AND (_category IS NULL OR p.category = _category)
  ORDER BY
    (public.peak_norm(p.name) = n) DESC,
    (public.peak_norm(p.name) LIKE n || '%') DESC,
    public.similarity(public.peak_norm(p.name), n) DESC,
    p.name
  LIMIT LEAST(GREATEST(coalesce(_limit, 20), 1), 50);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.search_world_places(text, integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_world_places(text, integer, text, text) TO anon, authenticated, service_role;