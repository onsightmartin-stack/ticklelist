CREATE TABLE public.location_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.location_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read location updates"
  ON public.location_updates
  FOR SELECT
  TO anon, authenticated
  USING (true);

INSERT INTO public.location_updates (lat, lng, recorded_at)
VALUES (57.7089, 11.9746, '2026-03-29T12:00:00Z');