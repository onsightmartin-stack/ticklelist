ALTER TABLE public.adventure_signups DROP CONSTRAINT IF EXISTS adventure_signups_status_check;
ALTER TABLE public.adventure_signups ADD CONSTRAINT adventure_signups_status_check CHECK (status IN ('interested','joining','invited'));

DROP POLICY IF EXISTS "Creators can invite members" ON public.adventure_signups;
CREATE POLICY "Creators can invite members"
ON public.adventure_signups FOR INSERT TO authenticated
WITH CHECK (
  status = 'invited'
  AND EXISTS (SELECT 1 FROM public.adventures a WHERE a.id = adventure_id AND a.creator_id = auth.uid())
);

DROP POLICY IF EXISTS "Creators can remove invites" ON public.adventure_signups;
CREATE POLICY "Creators can remove invites"
ON public.adventure_signups FOR DELETE TO authenticated
USING (
  status = 'invited'
  AND EXISTS (SELECT 1 FROM public.adventures a WHERE a.id = adventure_id AND a.creator_id = auth.uid())
);