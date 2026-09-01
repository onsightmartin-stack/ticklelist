CREATE TABLE public.country_warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_name text NOT NULL,
  advisory_level integer NOT NULL DEFAULT 1,
  advisory_text text,
  source text DEFAULT 'US State Department',
  last_checked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(country_name)
);

ALTER TABLE public.country_warnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Country warnings are publicly readable"
  ON public.country_warnings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can manage country_warnings"
  ON public.country_warnings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_country_warnings_updated_at
  BEFORE UPDATE ON public.country_warnings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();