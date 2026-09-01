-- 1. adventure_signups: signed-in members only, and hide private messages
DROP POLICY IF EXISTS "Signups are viewable by everyone" ON public.adventure_signups;
CREATE POLICY "Signups are viewable by members"
  ON public.adventure_signups FOR SELECT TO authenticated USING (true);

REVOKE SELECT ON public.adventure_signups FROM anon;
REVOKE SELECT ON public.adventure_signups FROM authenticated;
GRANT SELECT (id, adventure_id, user_id, status, created_at, updated_at)
  ON public.adventure_signups TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.adventure_signups TO authenticated;
GRANT ALL ON public.adventure_signups TO service_role;

-- 2. notification_prefs: owner-only visibility
DROP POLICY IF EXISTS "Prefs are viewable by everyone" ON public.notification_prefs;
CREATE POLICY "Members view their own prefs"
  ON public.notification_prefs FOR SELECT TO authenticated USING (auth.uid() = user_id);
REVOKE SELECT ON public.notification_prefs FROM anon;

-- Safe helper so the app can check a recipient's preference without reading their row
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
       ELSE true
     END
     FROM public.notification_prefs np
     WHERE np.user_id = _user_id),
    true
  )
$$;

REVOKE EXECUTE ON FUNCTION public.wants_notification(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wants_notification(uuid, text) TO authenticated, service_role;

-- 3. Lock down SECURITY DEFINER / internal helpers
REVOKE EXECUTE ON FUNCTION public.increment_visitor_count() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_visitor_count() TO service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;