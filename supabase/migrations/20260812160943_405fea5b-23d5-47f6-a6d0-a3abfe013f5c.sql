-- Restrict has_role so a signed-in user can only probe their own roles.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid := auth.uid();
  _is_self boolean := (_caller IS NOT NULL AND _caller = _user_id);
  _caller_admin boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _caller AND ur.role = 'admin'::app_role
  ) INTO _caller_admin;

  -- Trusted server-side contexts (no auth.uid(), e.g. service_role or triggers)
  -- keep full access; end users may only ask about themselves.
  IF _caller IS NOT NULL AND NOT _is_self AND NOT _caller_admin THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND ur.role = _role
  );
END;
$$;

-- Background/trigger-only definer functions: not part of the public API surface.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.wants_notification(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_visitor_count() FROM PUBLIC, anon, authenticated;

-- Caller-verified functions stay available to signed-in members only.
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.send_notification(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_notification(uuid, text, text, text) TO authenticated, service_role;