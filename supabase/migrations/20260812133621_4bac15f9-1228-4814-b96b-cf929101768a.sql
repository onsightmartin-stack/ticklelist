REVOKE EXECUTE ON FUNCTION public.wants_notification(uuid, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wants_notification(uuid, text) TO service_role;