ALTER TABLE public.world_peaks
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'geonames',
  ADD COLUMN IF NOT EXISTS added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE SEQUENCE IF NOT EXISTS public.world_peaks_id_seq AS bigint START WITH 900000000 OWNED BY public.world_peaks.id;
ALTER TABLE public.world_peaks ALTER COLUMN id SET DEFAULT nextval('public.world_peaks_id_seq');

-- Only guard against duplicates among manually imported peaks; the GeoNames
-- import legitimately contains repeated name/country/elevation combinations.
CREATE UNIQUE INDEX IF NOT EXISTS world_peaks_import_dedupe_idx
  ON public.world_peaks (lower(name), coalesce(country_code, ''), coalesce(elevation, -1))
  WHERE source <> 'geonames';

GRANT INSERT ON public.world_peaks TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.world_peaks_id_seq TO authenticated, service_role;

DROP POLICY IF EXISTS "Admins can add peaks" ON public.world_peaks;
CREATE POLICY "Admins can add peaks"
  ON public.world_peaks FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND added_by = auth.uid());