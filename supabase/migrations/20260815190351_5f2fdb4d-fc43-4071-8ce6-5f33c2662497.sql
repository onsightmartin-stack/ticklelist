CREATE OR REPLACE FUNCTION public.auto_visit_from_ascent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  c text := nullif(btrim(coalesce(NEW.country, '')), '');
BEGIN
  IF c IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.visits (user_id, place_key, place_name, country, place_type, visit_date, is_public)
  VALUES (NEW.user_id, 'co:' || c, c, c, 'country', NEW.ascent_date, true)
  ON CONFLICT (user_id, place_key) DO UPDATE
    SET visit_date = LEAST(
          COALESCE(public.visits.visit_date, EXCLUDED.visit_date),
          COALESCE(EXCLUDED.visit_date, public.visits.visit_date)
        ),
        updated_at = now();

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.auto_visit_from_ascent() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS ascents_auto_visit ON public.ascents;
CREATE TRIGGER ascents_auto_visit
AFTER INSERT OR UPDATE OF country, ascent_date ON public.ascents
FOR EACH ROW EXECUTE FUNCTION public.auto_visit_from_ascent();