import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Visit } from "@/data/places";

/** Loads the visits logbook (own + public entries from other members). */
export const useVisits = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("visits")
      .select("*")
      .order("visit_date", { ascending: false, nullsFirst: false });
    setVisits((data as Visit[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { visits, loading, reload: load };
};
