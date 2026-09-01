CREATE TABLE public.ascents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  peak_name text NOT NULL,
  peak_type text NOT NULL DEFAULT 'country_highpoint',
  country text,
  elevation text,
  ascent_date date NOT NULL,
  route text,
  trip_report text,
  photo_url text,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ascents_peak_type_check CHECK (peak_type IN ('country_highpoint','famous_peak')),
  CONSTRAINT ascents_unique_per_day UNIQUE (user_id, peak_name, ascent_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ascents TO authenticated;
GRANT SELECT ON public.ascents TO anon;
GRANT ALL ON public.ascents TO service_role;

ALTER TABLE public.ascents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public ascents are viewable by everyone"
  ON public.ascents FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their own ascents"
  ON public.ascents FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ascents"
  ON public.ascents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ascents"
  ON public.ascents FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ascents"
  ON public.ascents FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_ascents_updated_at
  BEFORE UPDATE ON public.ascents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX ascents_user_idx ON public.ascents(user_id);
CREATE INDEX ascents_date_idx ON public.ascents(ascent_date DESC);