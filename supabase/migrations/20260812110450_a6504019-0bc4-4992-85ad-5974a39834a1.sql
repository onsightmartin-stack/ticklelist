CREATE TABLE public.profile_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profile_views_unique_pair UNIQUE (profile_id, viewer_id),
  CONSTRAINT profile_views_not_self CHECK (profile_id <> viewer_id)
);

CREATE INDEX profile_views_profile_idx ON public.profile_views (profile_id, updated_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.profile_views TO authenticated;
GRANT ALL ON public.profile_views TO service_role;

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can see who viewed their profile"
  ON public.profile_views FOR SELECT TO authenticated
  USING (auth.uid() = profile_id);

CREATE POLICY "Members can record their own visit"
  ON public.profile_views FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = viewer_id AND auth.uid() <> profile_id);

CREATE POLICY "Members can refresh their own visit"
  ON public.profile_views FOR UPDATE TO authenticated
  USING (auth.uid() = viewer_id)
  WITH CHECK (auth.uid() = viewer_id);

CREATE TRIGGER update_profile_views_updated_at
  BEFORE UPDATE ON public.profile_views
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();