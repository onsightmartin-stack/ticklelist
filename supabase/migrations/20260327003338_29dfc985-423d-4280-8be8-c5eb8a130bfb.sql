
CREATE TABLE public.visitor_counter (
  id integer PRIMARY KEY DEFAULT 1,
  count bigint NOT NULL DEFAULT 0
);

INSERT INTO public.visitor_counter (id, count) VALUES (1, 0);

ALTER TABLE public.visitor_counter ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visitor counter is publicly readable"
  ON public.visitor_counter FOR SELECT TO public USING (true);

CREATE OR REPLACE FUNCTION public.increment_visitor_count()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count bigint;
BEGIN
  UPDATE public.visitor_counter SET count = count + 1 WHERE id = 1 RETURNING count INTO new_count;
  RETURN new_count;
END;
$$;
