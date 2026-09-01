UPDATE public.ascents SET country = 'Austria' WHERE country = 'AT';
DELETE FROM public.visits WHERE place_key IN ('co:AT','co:USA');
UPDATE public.visits SET country = 'Austria', place_name = 'Austria', place_key = 'co:Austria' WHERE country = 'AT';
UPDATE public.visits SET country = 'United States', place_name = 'United States', place_key = 'co:United States' WHERE country = 'USA';