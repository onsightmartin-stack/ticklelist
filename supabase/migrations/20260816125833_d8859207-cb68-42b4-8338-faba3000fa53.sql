ALTER TABLE public.ascents
  ADD COLUMN IF NOT EXISTS partner_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS partner_names text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS with_group boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS guiding text,
  ADD COLUMN IF NOT EXISTS oxygen text;

ALTER TABLE public.ascents
  DROP CONSTRAINT IF EXISTS ascents_guiding_check,
  ADD CONSTRAINT ascents_guiding_check CHECK (guiding IS NULL OR guiding IN ('self_guided','guided'));

ALTER TABLE public.ascents
  DROP CONSTRAINT IF EXISTS ascents_oxygen_check,
  ADD CONSTRAINT ascents_oxygen_check CHECK (oxygen IS NULL OR oxygen IN ('no_oxygen','oxygen'));