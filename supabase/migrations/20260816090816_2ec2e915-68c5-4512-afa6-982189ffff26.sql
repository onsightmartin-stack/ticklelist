-- immutable dedupe key: strip parentheses, accents/ligatures, non-alphanumerics
CREATE OR REPLACE FUNCTION public.ascent_dedupe_key(_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT regexp_replace(
    translate(
      lower(regexp_replace(coalesce(_name,''), '\s*\([^)]*\)', '', 'g')),
      'áàâäãåéèêëíìîïóòôöõúùûüñçýÿšžğıœæø',
      'aaaaaaeeeeiiiiooooouuuuncyyszgioeao'
    ),
    '[^a-z0-9]', '', 'g')
$$;

-- one-off cleanup: keep the richest row per (user, peak key, date)
WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY user_id, public.ascent_dedupe_key(peak_name), ascent_date
           ORDER BY (photo_url IS NOT NULL)::int + (trip_report IS NOT NULL)::int + (route IS NOT NULL)::int DESC,
                    length(peak_name) DESC,
                    created_at ASC
         ) AS rn
  FROM public.ascents
)
DELETE FROM public.ascents a USING ranked r WHERE a.id = r.id AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS ascents_unique_per_day
  ON public.ascents (user_id, public.ascent_dedupe_key(peak_name), ascent_date);

REVOKE EXECUTE ON FUNCTION public.ascent_dedupe_key(text) FROM anon, authenticated;