-- 1. adventure_signups: restrict SELECT
DROP POLICY IF EXISTS "Signups are viewable by members" ON public.adventure_signups;
CREATE POLICY "Signups viewable by owner and adventure creator"
ON public.adventure_signups FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.adventures a WHERE a.id = adventure_id AND a.creator_id = auth.uid())
);

-- 2. storage: ascent photos visibility
DROP POLICY IF EXISTS "Members can read ascent photos" ON storage.objects;
CREATE POLICY "Ascent photos follow ascent visibility"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'ascent-photos'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.ascents a
      WHERE a.is_public
        AND a.user_id::text = (storage.foldername(name))[1]
        AND a.photo_url LIKE '%' || name
    )
  )
);

-- 3. notifications: no direct client inserts; use verified definer function
DROP POLICY IF EXISTS "Members can create notifications as themselves" ON public.notifications;

CREATE OR REPLACE FUNCTION public.send_notification(
  _recipient_id uuid,
  _kind text,
  _body text,
  _link text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _actor uuid := auth.uid();
  _ok boolean := false;
  _id uuid;
BEGIN
  IF _actor IS NULL OR _recipient_id IS NULL OR _recipient_id = _actor THEN
    RETURN NULL;
  END IF;
  IF _kind NOT IN ('follow','like','comment','mention','cheer') THEN
    RETURN NULL;
  END IF;
  IF NOT public.wants_notification(_recipient_id, _kind) THEN
    RETURN NULL;
  END IF;

  IF _kind = 'follow' THEN
    SELECT EXISTS (SELECT 1 FROM public.follows f
      WHERE f.follower_id = _actor AND f.following_id = _recipient_id) INTO _ok;
  ELSIF _kind = 'like' THEN
    SELECT EXISTS (SELECT 1 FROM public.post_likes l JOIN public.posts p ON p.id = l.post_id
      WHERE l.user_id = _actor AND p.user_id = _recipient_id) INTO _ok;
  ELSIF _kind = 'comment' THEN
    SELECT EXISTS (SELECT 1 FROM public.post_comments c JOIN public.posts p ON p.id = c.post_id
      WHERE c.user_id = _actor AND p.user_id = _recipient_id) INTO _ok;
  ELSIF _kind = 'cheer' THEN
    SELECT EXISTS (SELECT 1 FROM public.ascent_cheers ch JOIN public.ascents a ON a.id = ch.ascent_id
      WHERE ch.user_id = _actor AND a.user_id = _recipient_id) INTO _ok;
  ELSIF _kind = 'mention' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.posts p WHERE p.user_id = _actor AND p.created_at > now() - interval '10 minutes'
      UNION ALL
      SELECT 1 FROM public.post_comments c WHERE c.user_id = _actor AND c.created_at > now() - interval '10 minutes'
    ) INTO _ok;
  END IF;

  IF NOT _ok THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.notifications (recipient_id, actor_id, kind, body, link)
  VALUES (_recipient_id, _actor, _kind, left(coalesce(_body,''), 280), _link)
  RETURNING id INTO _id;

  RETURN _id;
END;
$$;

REVOKE ALL ON FUNCTION public.send_notification(uuid, text, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.send_notification(uuid, text, text, text) TO authenticated;

-- 4. visitor counter routine is server-only
REVOKE EXECUTE ON FUNCTION public.increment_visitor_count() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_visitor_count() TO service_role;