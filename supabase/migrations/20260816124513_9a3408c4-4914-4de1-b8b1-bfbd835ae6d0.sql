ALTER TABLE public.ascents ADD COLUMN IF NOT EXISTS date_precision text NOT NULL DEFAULT 'day';
ALTER TABLE public.ascents DROP CONSTRAINT IF EXISTS ascents_date_precision_check;
ALTER TABLE public.ascents ADD CONSTRAINT ascents_date_precision_check CHECK (date_precision IN ('day','month','year'));
DELETE FROM public.ascents WHERE id = '0920933d-53f0-4bda-82ae-e03acd5ded8c';