import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { notify } from "@/lib/notify";

/**
 * Tracks who the signed-in climber follows, plus follower counts for everyone.
 */
export const useFollows = () => {
  const { user } = useAuth();
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [followerCounts, setFollowerCounts] = useState<Record<string, number>>({});
  const [followers, setFollowers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("follows").select("follower_id, following_id");
    const rows = data ?? [];

    const counts: Record<string, number> = {};
    const mine = new Set<string>();
    const theirs = new Set<string>();
    for (const r of rows) {
      counts[r.following_id] = (counts[r.following_id] ?? 0) + 1;
      if (user && r.follower_id === user.id) mine.add(r.following_id);
      if (user && r.following_id === user.id) theirs.add(r.follower_id);
    }
    setFollowerCounts(counts);
    setFollowing(mine);
    setFollowers(theirs);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleFollow = useCallback(
    async (targetId: string) => {
      if (!user) {
        toast({ title: "Sign in to follow climbers" });
        return;
      }
      if (targetId === user.id) return;

      const isFollowing = following.has(targetId);

      // Optimistic update so the button reacts instantly.
      setFollowing((prev) => {
        const next = new Set(prev);
        isFollowing ? next.delete(targetId) : next.add(targetId);
        return next;
      });
      setFollowerCounts((prev) => ({
        ...prev,
        [targetId]: Math.max(0, (prev[targetId] ?? 0) + (isFollowing ? -1 : 1)),
      }));

      const { error } = isFollowing
        ? await supabase
            .from("follows")
            .delete()
            .eq("follower_id", user.id)
            .eq("following_id", targetId)
        : await supabase.from("follows").insert({ follower_id: user.id, following_id: targetId });

      if (error) {
        toast({ title: "Could not update follow", description: error.message, variant: "destructive" });
        load();
      } else if (!isFollowing) {
        notify({
          recipientId: targetId,
          actorId: user.id,
          kind: "follow",
          body: "started following you",
          link: `/community/members/${user.id}`,
        });
      }
    },
    [user, following, load],
  );

  return { following, followers, followerCounts, toggleFollow, loading, reload: load };
};
