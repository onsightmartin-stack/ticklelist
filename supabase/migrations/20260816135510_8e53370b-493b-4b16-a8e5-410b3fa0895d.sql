CREATE TABLE public.bonus_titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title_id text NOT NULL,
  story text,
  happened_on date,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, title_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bonus_titles TO authenticated;
GRANT SELECT ON public.bonus_titles TO anon;
GRANT ALL ON public.bonus_titles TO service_role;

ALTER TABLE public.bonus_titles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bonus titles are public" ON public.bonus_titles
  FOR SELECT USING (true);

CREATE POLICY "Members add their own titles" ON public.bonus_titles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members edit their own titles" ON public.bonus_titles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND verified = false);

CREATE POLICY "Admins verify titles" ON public.bonus_titles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Members remove their own titles" ON public.bonus_titles
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_bonus_titles_updated_at
  BEFORE UPDATE ON public.bonus_titles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();