CREATE TABLE public.notification_prefs (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  follow boolean NOT NULL DEFAULT true,
  "like" boolean NOT NULL DEFAULT true,
  comment boolean NOT NULL DEFAULT true,
  mention boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.notification_prefs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_prefs TO authenticated;
GRANT ALL ON public.notification_prefs TO service_role;

ALTER TABLE public.notification_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prefs are viewable by everyone" ON public.notification_prefs FOR SELECT USING (true);
CREATE POLICY "Members manage their own prefs" ON public.notification_prefs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members update their own prefs" ON public.notification_prefs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members delete their own prefs" ON public.notification_prefs FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_notification_prefs_updated_at BEFORE UPDATE ON public.notification_prefs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();