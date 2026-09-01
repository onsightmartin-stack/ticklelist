import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { BonusTitleRow } from "@/lib/bonus-titles";

/** Loads a member's claimed honour badges. */
export const useBonusTitles = (userId?: string | null) => {
  const [rows, setRows] = useState<BonusTitleRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) {
      setRows([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("bonus_titles")
      .select("id, user_id, title_id, story, happened_on, verified, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setRows((data as BonusTitleRow[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    void reload();
  }, [reload]);

  return { rows, loading, reload };
};
