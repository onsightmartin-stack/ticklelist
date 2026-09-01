CREATE TABLE public.peakbagger_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES public.peakbagger_import_runs(id) ON DELETE SET NULL,
  batch_no integer NOT NULL,
  checksum text NOT NULL UNIQUE,
  row_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  error text,
  applied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX peakbagger_import_batches_run_idx ON public.peakbagger_import_batches (run_id, batch_no);

CREATE TABLE public.peakbagger_import_lists (
  list_id text PRIMARY KEY,
  run_id uuid REFERENCES public.peakbagger_import_runs(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'done',
  row_count integer NOT NULL DEFAULT 0,
  error text,
  scraped_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.peakbagger_import_batches TO authenticated;
GRANT SELECT ON public.peakbagger_import_lists TO authenticated;
GRANT ALL ON public.peakbagger_import_batches TO service_role;
GRANT ALL ON public.peakbagger_import_lists TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.peakbagger_import_batches TO sandbox_exec;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.peakbagger_import_lists TO sandbox_exec;
GRANT UPDATE (peakbagger_id) ON public.world_peaks TO sandbox_exec;

ALTER TABLE public.peakbagger_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peakbagger_import_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read import batches" ON public.peakbagger_import_batches
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can read import lists" ON public.peakbagger_import_lists
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER peakbagger_import_batches_updated_at
  BEFORE UPDATE ON public.peakbagger_import_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();