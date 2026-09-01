import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { applyProgressOverlay, MARTIN_PROFILE_ID } from "@/lib/progress-link";

let applied = false;

/**
 * Pulls Martin's country high-point ascents from his Ticklelist profile and
 * merges them into the website's progress data, so ticking a peak in the
 * community app updates onsightmartin.com too. Returns a version counter that
 * changes when the overlay modified anything, forcing a re-render.
 */
export function useLinkedProgress(): number {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (applied) return;
    let active = true;

    void supabase
      .from("ascents")
      .select("country, ascent_date")
      .eq("user_id", MARTIN_PROFILE_ID)
      .eq("peak_type", "country_highpoint")
      .eq("is_public", true)
      .then(({ data, error }) => {
        if (!active || error || !data) return;
        applied = true;
        if (applyProgressOverlay(data as { country: string; ascent_date: string | null }[])) {
          setVersion((v) => v + 1);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return version;
}
