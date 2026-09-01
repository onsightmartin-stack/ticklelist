import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Adventure, PublicProfile, Signup } from "@/lib/community";
import type { Ascent } from "@/lib/peak-catalog";
import type { Visit } from "@/data/places";

/** Shared loader for every Ticklelist screen. */
export const useCommunityData = () => {
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [ascents, setAscents] = useState<Ascent[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [profiles, setProfiles] = useState<Record<string, PublicProfile>>({});
  const [fetching, setFetching] = useState(true);

  const load = useCallback(async () => {
    setFetching(true);
    const [{ data: advs }, { data: sups }, { data: profs }, { data: asc }, { data: vis }] = await Promise.all([
      supabase.from("adventures").select("*").order("created_at", { ascending: false }),
      supabase
        .from("adventure_signups")
        .select("id, adventure_id, user_id, status, created_at, updated_at"),
      supabase.from("profiles").select("id, display_name, country, avatar_url"),
      supabase.from("ascents").select("*").order("ascent_date", { ascending: false }),
      supabase.from("visits").select("*").order("visit_date", { ascending: false, nullsFirst: false }),
    ]);
    setAdventures((advs as Adventure[]) ?? []);
    setSignups((sups as Signup[]) ?? []);
    setAscents((asc as Ascent[]) ?? []);
    setVisits((vis as Visit[]) ?? []);
    const map: Record<string, PublicProfile> = {};
    ((profs as PublicProfile[]) ?? []).forEach((p) => {
      map[p.id] = p;
    });
    setProfiles(map);
    setFetching(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { adventures, signups, ascents, visits, profiles, fetching, reload: load };
};
