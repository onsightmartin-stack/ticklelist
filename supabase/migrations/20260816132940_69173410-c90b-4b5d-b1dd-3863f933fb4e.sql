ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS date_precision text NOT NULL DEFAULT 'day';
ALTER TABLE public.visits DROP CONSTRAINT IF EXISTS visits_date_precision_check;
ALTER TABLE public.visits ADD CONSTRAINT visits_date_precision_check CHECK (date_precision IN ('day','month','year'));