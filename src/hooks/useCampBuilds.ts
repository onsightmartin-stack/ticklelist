import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export interface CampBuildRow {
  id: string;
  user_id: string;
  build_id: string;
  label: string;
  x: number;
  y: number;
}

/** Every shelter standing at Base Camp, plus helpers to raise or clear your own. */
export const useCampBuilds = (userId?: string | null) => {
  const [builds, setBuilds] = useState<CampBuildRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("camp_builds")
      .select("id, user_id, build_id, label, x, y");
    setBuilds(((data as CampBuildRow[]) ?? []).map((b) => ({ ...b, x: Number(b.x), y: Number(b.y) })));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const mine = userId ? builds.find((b) => b.user_id === userId) ?? null : null;

  /** Create or replace the signed-in member's build. */
  const save = useCallback(
    async (build: { build_id: string; label: string; x: number; y: number }) => {
      if (!userId) return { error: "Sign in first" };
      const { error } = await supabase
        .from("camp_builds")
        .upsert({ user_id: userId, ...build }, { onConflict: "user_id" });
      if (error) return { error: error.message };
      await load();
      return {};
    },
    [userId, load],
  );

  const remove = useCallback(async () => {
    if (!userId) return;
    await supabase.from("camp_builds").delete().eq("user_id", userId);
    await load();
  }, [userId, load]);

  return { builds, mine, loading, save, remove, reload: load };
};
