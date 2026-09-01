import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const PAGE_SIZE = 12;

export interface ProfileVisit {
  viewer_id: string;
  updated_at: string;
}

/**
 * Profile visitor log. Only the owner of a profile can read its visits (RLS),
 * so `visits` is always "who looked at *my* profile".
 */
export const useProfileViews = (profileId: string | undefined) => {
  const { user } = useAuth();
  const [visits, setVisits] = useState<ProfileVisit[]>([]);
  const isOwner = !!user && !!profileId && user.id === profileId;

  /** Record (or refresh) the signed-in member's visit to someone else's profile. */
  const recordVisit = useCallback(async () => {
    if (!user || !profileId || user.id === profileId) return;
    await supabase
      .from("profile_views")
      .upsert(
        { profile_id: profileId, viewer_id: user.id, updated_at: new Date().toISOString() },
        { onConflict: "profile_id,viewer_id" },
      );
  }, [user, profileId]);

  useEffect(() => {
    void recordVisit();
  }, [recordVisit]);

  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(
    async (from: number) => {
      if (!profileId) return [] as ProfileVisit[];
      const { data } = await supabase
        .from("profile_views")
        .select("viewer_id, updated_at")
        .eq("profile_id", profileId)
        .order("updated_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      const rows = (data ?? []) as ProfileVisit[];
      setHasMore(rows.length === PAGE_SIZE);
      return rows;
    },
    [profileId],
  );

  useEffect(() => {
    if (!isOwner || !profileId) {
      setVisits([]);
      setHasMore(false);
      return;
    }
    let active = true;
    void fetchPage(0).then((rows) => {
      if (active) setVisits(rows);
    });
    return () => {
      active = false;
    };
  }, [isOwner, profileId, fetchPage]);

  /** Append the next page of older visitors. */
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const rows = await fetchPage(visits.length);
    setVisits((prev) => {
      const seen = new Set(prev.map((v) => v.viewer_id));
      return [...prev, ...rows.filter((r) => !seen.has(r.viewer_id))];
    });
    setLoadingMore(false);
  }, [fetchPage, hasMore, loadingMore, visits.length]);

  return { visits, isOwner, recordVisit, hasMore, loadingMore, loadMore };
};
