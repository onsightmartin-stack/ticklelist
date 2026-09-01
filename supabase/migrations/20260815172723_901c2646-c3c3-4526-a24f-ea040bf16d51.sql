CREATE TABLE public.visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  place_key TEXT NOT NULL,
  place_name TEXT NOT NULL,
  country TEXT,
  place_type TEXT NOT NULL DEFAULT 'country',
  visit_date DATE,
  notes TEXT,
  photo_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, place_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.visits TO authenticated;
GRANT ALL ON public.visits TO service_role;

ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read public visits" ON public.visits
  FOR SELECT TO authenticated USING (is_public OR user_id = auth.uid());
CREATE POLICY "Members insert own visits" ON public.visits
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Members update own visits" ON public.visits
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Members delete own visits" ON public.visits
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON public.visits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX visits_user_idx ON public.visits (user_id);