CREATE TABLE public.outbound_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  url text NOT NULL,
  video_id text,
  label text,
  page_path text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX outbound_clicks_created_at_idx ON public.outbound_clicks (created_at DESC);
CREATE INDEX outbound_clicks_video_idx ON public.outbound_clicks (video_id);

GRANT SELECT ON public.outbound_clicks TO authenticated;
GRANT ALL ON public.outbound_clicks TO service_role;

ALTER TABLE public.outbound_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view outbound clicks"
  ON public.outbound_clicks FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));