CREATE TABLE public.camp_builds (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  build_id text NOT NULL,
  label text NOT NULL,
  x double precision NOT NULL DEFAULT 900,
  y double precision NOT NULL DEFAULT 780,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.camp_builds TO authenticated;
GRANT ALL ON public.camp_builds TO service_role;

ALTER TABLE public.camp_builds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view camp builds"
  ON public.camp_builds FOR SELECT TO authenticated USING (true);

CREATE POLICY "Members can create their own camp build"
  ON public.camp_builds FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can update their own camp build"
  ON public.camp_builds FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can delete their own camp build"
  ON public.camp_builds FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_camp_builds_updated_at
  BEFORE UPDATE ON public.camp_builds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();