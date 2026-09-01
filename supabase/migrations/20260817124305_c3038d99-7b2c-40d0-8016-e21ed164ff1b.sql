CREATE OR REPLACE FUNCTION public.peak_ascent_registry(_name text, _limit integer DEFAULT 50)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  display_name text,
  avatar_url text,
  ascent_date date,
  date_precision text,
  route text,
  trip_report text,
  photo_url text,
  country text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id, a.user_id, p.display_name, p.avatar_url, a.ascent_date, a.date_precision,
         a.route, a.trip_report, a.photo_url, a.country
  FROM public.ascents a
  LEFT JOIN public.profiles p ON p.id = a.user_id
  WHERE a.is_public = true
    AND public.peak_norm(a.peak_name) = public.peak_norm(_name)
  ORDER BY a.ascent_date DESC
  LIMIT LEAST(COALESCE(_limit, 50), 200);
$$;

GRANT EXECUTE ON FUNCTION public.peak_ascent_registry(text, integer) TO anon, authenticated, service_role;