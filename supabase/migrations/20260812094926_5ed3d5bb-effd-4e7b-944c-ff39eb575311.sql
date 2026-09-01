CREATE TABLE public.ascent_cheers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ascent_id uuid NOT NULL REFERENCES public.ascents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ascent_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.ascent_cheers TO authenticated;
GRANT ALL ON public.ascent_cheers TO service_role;

ALTER TABLE public.ascent_cheers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cheers are viewable by members"
  ON public.ascent_cheers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can cheer"
  ON public.ascent_cheers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members can remove their own cheer"
  ON public.ascent_cheers FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX ascent_cheers_ascent_id_idx ON public.ascent_cheers(ascent_id);

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_kind_check
  CHECK (kind IN ('follow','like','comment','mention','cheer'));

ALTER TABLE public.notification_prefs ADD COLUMN IF NOT EXISTS cheer boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.wants_notification(_user_id uuid, _kind text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT CASE _kind
       WHEN 'follow' THEN np.follow
       WHEN 'like' THEN np."like"
       WHEN 'comment' THEN np.comment
       WHEN 'mention' THEN np.mention
       WHEN 'cheer' THEN np.cheer
       ELSE true
     END
     FROM public.notification_prefs np
     WHERE np.user_id = _user_id),
    true
  )
$$;

REVOKE EXECUTE ON FUNCTION public.wants_notification(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wants_notification(uuid, text) TO authenticated, service_role;