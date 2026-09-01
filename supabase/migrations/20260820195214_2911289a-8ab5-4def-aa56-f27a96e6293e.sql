CREATE TABLE public.peakbagger_import_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'running',
  lists_total integer NOT NULL DEFAULT 0,
  lists_done integer NOT NULL DEFAULT 0,
  lists_blocked integer NOT NULL DEFAULT 0,
  peaks_captured integer NOT NULL DEFAULT 0,
  batches_total integer NOT NULL DEFAULT 0,
  batches_applied integer NOT NULL DEFAULT 0,
  rows_upserted integer NOT NULL DEFAULT 0,
  last_error text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.peakbagger_import_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES public.peakbagger_import_runs(id) ON DELETE CASCADE,
  level text NOT NULL DEFAULT 'info',
  scope text,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX peakbagger_import_events_run_idx ON public.peakbagger_import_events (run_id, created_at DESC);

GRANT SELECT ON public.peakbagger_import_runs TO authenticated;
GRANT SELECT ON public.peakbagger_import_events TO authenticated;
GRANT ALL ON public.peakbagger_import_runs TO service_role;
GRANT ALL ON public.peakbagger_import_events TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.peakbagger_import_runs TO sandbox_exec;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.peakbagger_import_events TO sandbox_exec;

ALTER TABLE public.peakbagger_import_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peakbagger_import_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read import runs" ON public.peakbagger_import_runs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can read import events" ON public.peakbagger_import_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER peakbagger_import_runs_updated_at
  BEFORE UPDATE ON public.peakbagger_import_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();