CREATE TABLE public.content_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open',
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (reporter_id, target_type, target_id)
);

CREATE INDEX content_reports_status_idx ON public.content_reports (status, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.content_reports TO authenticated;
GRANT ALL ON public.content_reports TO service_role;

ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can report content"
ON public.content_reports FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = reporter_id
  AND target_type IN ('post','comment')
  AND reason IN ('spam','harassment','nudity','violence','misinformation','other')
  AND status = 'open'
);

CREATE POLICY "Reporters can view their own reports"
ON public.content_reports FOR SELECT TO authenticated
USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
ON public.content_reports FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can review reports"
ON public.content_reports FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_content_reports_updated_at
BEFORE UPDATE ON public.content_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.validate_content_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.target_type = 'post' THEN
    IF NOT EXISTS (SELECT 1 FROM public.posts p WHERE p.id = NEW.target_id) THEN
      RAISE EXCEPTION 'Post not found';
    END IF;
  ELSIF NEW.target_type = 'comment' THEN
    IF NOT EXISTS (SELECT 1 FROM public.post_comments c WHERE c.id = NEW.target_id) THEN
      RAISE EXCEPTION 'Comment not found';
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid target type';
  END IF;
  NEW.details = left(coalesce(NEW.details, ''), 500);
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.validate_content_report() FROM anon, authenticated;

CREATE TRIGGER validate_content_report_before_insert
BEFORE INSERT ON public.content_reports
FOR EACH ROW EXECUTE FUNCTION public.validate_content_report();