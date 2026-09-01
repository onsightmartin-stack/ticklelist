-- Table to store YouTube videos and AI-extracted climb data
CREATE TABLE public.youtube_climbs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id TEXT NOT NULL UNIQUE,
  video_title TEXT NOT NULL,
  video_description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- AI-extracted climb data
  peak_name TEXT,
  country TEXT,
  continent TEXT,
  elevation TEXT,
  climb_date TEXT,
  
  -- Status: pending (AI detected), confirmed (approved), rejected (false positive)
  status TEXT NOT NULL DEFAULT 'pending',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.youtube_climbs ENABLE ROW LEVEL SECURITY;

-- Anyone can read (public portfolio site)
CREATE POLICY "YouTube climbs are publicly readable"
  ON public.youtube_climbs
  FOR SELECT
  USING (true);

-- Only service role can manage (edge functions)
CREATE POLICY "Service role can manage youtube_climbs"
  ON public.youtube_climbs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_youtube_climbs_updated_at
  BEFORE UPDATE ON public.youtube_climbs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();