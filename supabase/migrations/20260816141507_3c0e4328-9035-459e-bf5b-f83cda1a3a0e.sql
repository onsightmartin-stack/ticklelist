-- 1. Public vote tally without a publicly executable SECURITY DEFINER function
ALTER TABLE public.peak_photo_entries ADD COLUMN IF NOT EXISTS votes integer NOT NULL DEFAULT 0;

UPDATE public.peak_photo_entries e
SET votes = COALESCE((SELECT count(*) FROM public.peak_photo_votes v WHERE v.entry_id = e.id), 0);

CREATE OR REPLACE FUNCTION public.sync_peak_photo_votes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.peak_photo_entries SET votes = votes + 1 WHERE id = NEW.entry_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.peak_photo_entries SET votes = GREATEST(votes - 1, 0) WHERE id = OLD.entry_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.entry_id IS DISTINCT FROM OLD.entry_id THEN
    UPDATE public.peak_photo_entries SET votes = GREATEST(votes - 1, 0) WHERE id = OLD.entry_id;
    UPDATE public.peak_photo_entries SET votes = votes + 1 WHERE id = NEW.entry_id;
  END IF;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_peak_photo_votes() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS peak_photo_votes_sync ON public.peak_photo_votes;
CREATE TRIGGER peak_photo_votes_sync
AFTER INSERT OR UPDATE OR DELETE ON public.peak_photo_votes
FOR EACH ROW EXECUTE FUNCTION public.sync_peak_photo_votes();

DROP FUNCTION IF EXISTS public.peak_photo_tallies(text);

-- Entries: votes column is aggregate-only and must not be client-writable
REVOKE UPDATE (votes) ON public.peak_photo_entries FROM anon, authenticated;

-- 2. Explicit admin-only write policies for photo rounds
DROP POLICY IF EXISTS "Admins manage rounds" ON public.peak_photo_rounds;
CREATE POLICY "Admins manage rounds" ON public.peak_photo_rounds
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));