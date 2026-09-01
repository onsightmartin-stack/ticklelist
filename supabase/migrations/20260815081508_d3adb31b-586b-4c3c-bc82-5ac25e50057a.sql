
CREATE TABLE public.peak_photo_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country_slug text NOT NULL,
  country text NOT NULL,
  peak_name text NOT NULL,
  photo_url text NOT NULL,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX peak_photo_entries_slug_idx ON public.peak_photo_entries (country_slug);
GRANT SELECT ON public.peak_photo_entries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.peak_photo_entries TO authenticated;
GRANT ALL ON public.peak_photo_entries TO service_role;
ALTER TABLE public.peak_photo_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Entries are publicly viewable" ON public.peak_photo_entries FOR SELECT USING (true);
CREATE POLICY "Members add their own entries" ON public.peak_photo_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members edit their own entries" ON public.peak_photo_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members delete their own entries" ON public.peak_photo_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.peak_photo_rounds (
  country_slug text PRIMARY KEY,
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL DEFAULT (now() + interval '30 days')
);
GRANT SELECT ON public.peak_photo_rounds TO anon;
GRANT SELECT ON public.peak_photo_rounds TO authenticated;
GRANT ALL ON public.peak_photo_rounds TO service_role;
ALTER TABLE public.peak_photo_rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rounds are publicly viewable" ON public.peak_photo_rounds FOR SELECT USING (true);

CREATE TABLE public.peak_photo_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id uuid NOT NULL REFERENCES public.peak_photo_entries(id) ON DELETE CASCADE,
  country_slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, country_slug)
);
CREATE INDEX peak_photo_votes_entry_idx ON public.peak_photo_votes (entry_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.peak_photo_votes TO authenticated;
GRANT ALL ON public.peak_photo_votes TO service_role;
ALTER TABLE public.peak_photo_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members see their own votes" ON public.peak_photo_votes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Members cast their own vote" ON public.peak_photo_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members change their own vote" ON public.peak_photo_votes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members withdraw their own vote" ON public.peak_photo_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.start_peak_photo_round()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.peak_photo_rounds (country_slug)
  VALUES (NEW.country_slug)
  ON CONFLICT (country_slug) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.start_peak_photo_round() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER peak_photo_votes_start_round
AFTER INSERT ON public.peak_photo_votes
FOR EACH ROW EXECUTE FUNCTION public.start_peak_photo_round();

CREATE OR REPLACE FUNCTION public.peak_photo_tallies(_country_slug text DEFAULT NULL)
RETURNS TABLE (entry_id uuid, country_slug text, votes bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.id, e.country_slug, count(v.id)
  FROM public.peak_photo_entries e
  LEFT JOIN public.peak_photo_votes v ON v.entry_id = e.id
  WHERE _country_slug IS NULL OR e.country_slug = _country_slug
  GROUP BY e.id, e.country_slug;
$$;
GRANT EXECUTE ON FUNCTION public.peak_photo_tallies(text) TO anon, authenticated;
