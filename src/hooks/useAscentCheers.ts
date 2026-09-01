import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { notify } from "@/lib/notify";

interface CheerAscent {
  id: string;
  user_id: string;
  peak_name: string;
}

export interface Cheerer {
  user_id: string;
  created_at: string;
}

/** Cheer counts across all ascents plus the signed-in member's own cheers. */
export const useAscentCheers = () => {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [mine, setMine] = useState<Set<string>>(new Set());
  const [cheerers, setCheerers] = useState<Record<string, Cheerer[]>>({});

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("ascent_cheers")
      .select("ascent_id, user_id, created_at")
      .order("created_at", { ascending: false });
    const next: Record<string, number> = {};
    const own = new Set<string>();
    const byAscent: Record<string, Cheerer[]> = {};
    (data ?? []).forEach((c) => {
      next[c.ascent_id] = (next[c.ascent_id] ?? 0) + 1;
      (byAscent[c.ascent_id] ??= []).push({ user_id: c.user_id, created_at: c.created_at });
      if (user && c.user_id === user.id) own.add(c.ascent_id);
    });
    setCounts(next);
    setMine(own);
    setCheerers(byAscent);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);


  const toggleCheer = useCallback(
    async (ascent: CheerAscent) => {
      if (!user) {
        toast({ title: "Sign in to cheer", description: "Members can cheer each other's ascents." });
        return;
      }
      const cheered = mine.has(ascent.id);

      setMine((prev) => {
        const next = new Set(prev);
        if (cheered) next.delete(ascent.id);
        else next.add(ascent.id);
        return next;
      });
      setCounts((prev) => ({
        ...prev,
        [ascent.id]: Math.max(0, (prev[ascent.id] ?? 0) + (cheered ? -1 : 1)),
      }));
      setCheerers((prev) => {
        const list = prev[ascent.id] ?? [];
        return {
          ...prev,
          [ascent.id]: cheered
            ? list.filter((c) => c.user_id !== user.id)
            : [{ user_id: user.id, created_at: new Date().toISOString() }, ...list],
        };
      });


      const { error } = cheered
        ? await supabase.from("ascent_cheers").delete().eq("ascent_id", ascent.id).eq("user_id", user.id)
        : await supabase.from("ascent_cheers").insert({ ascent_id: ascent.id, user_id: user.id });

      if (error) {
        toast({ title: "Could not update cheer", description: error.message, variant: "destructive" });
        load();
        return;
      }

      if (!cheered) {
        notify({
          recipientId: ascent.user_id,
          actorId: user.id,
          kind: "cheer",
          body: `cheered your ascent of ${ascent.peak_name} 🎉`,
          link: `/community/ascents#ascent-${ascent.id}`,
        });
      }
    },
    [load, mine, user],
  );

  return { counts, mine, cheerers, toggleCheer, reloadCheers: load };
};
