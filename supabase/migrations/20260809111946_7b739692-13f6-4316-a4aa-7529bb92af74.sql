-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'Climber',
  bio text,
  country text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'Climber'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ADVENTURES
CREATE TABLE public.adventures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  peak_name text NOT NULL,
  country text,
  elevation text,
  timing_type text NOT NULL DEFAULT 'anytime',
  target_date date,
  target_month integer,
  target_year integer,
  difficulty text,
  max_group_size integer,
  meeting_point text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT adventures_timing_type_check CHECK (timing_type IN ('exact','month','year','anytime','asap')),
  CONSTRAINT adventures_month_check CHECK (target_month IS NULL OR (target_month BETWEEN 1 AND 12)),
  CONSTRAINT adventures_year_check CHECK (target_year IS NULL OR (target_year BETWEEN 2020 AND 2100))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.adventures TO authenticated;
GRANT SELECT ON public.adventures TO anon;
GRANT ALL ON public.adventures TO service_role;
ALTER TABLE public.adventures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Adventures are viewable by everyone" ON public.adventures FOR SELECT USING (true);
CREATE POLICY "Members can create adventures" ON public.adventures FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update their adventures" ON public.adventures FOR UPDATE TO authenticated USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can delete their adventures" ON public.adventures FOR DELETE TO authenticated USING (auth.uid() = creator_id);
CREATE TRIGGER update_adventures_updated_at BEFORE UPDATE ON public.adventures
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SIGNUPS
CREATE TABLE public.adventure_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id uuid NOT NULL REFERENCES public.adventures(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'interested',
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT adventure_signups_status_check CHECK (status IN ('interested','joining')),
  UNIQUE (adventure_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.adventure_signups TO authenticated;
GRANT SELECT ON public.adventure_signups TO anon;
GRANT ALL ON public.adventure_signups TO service_role;
ALTER TABLE public.adventure_signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signups are viewable by everyone" ON public.adventure_signups FOR SELECT USING (true);
CREATE POLICY "Members can sign themselves up" ON public.adventure_signups FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members can update their own signup" ON public.adventure_signups FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members can remove their own signup" ON public.adventure_signups FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_adventure_signups_updated_at BEFORE UPDATE ON public.adventure_signups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_adventures_created_at ON public.adventures (created_at DESC);
CREATE INDEX idx_signups_adventure ON public.adventure_signups (adventure_id);