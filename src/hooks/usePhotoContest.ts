import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { fetchContest, type PhotoEntry, type PhotoRound } from "@/lib/photo-contest";

const db = supabase as unknown as { from: (table: string) => any };

/**
 * Summit photo contest state: entries with public tallies, the 30-day round
 * per peak, and the signed-in member's single vote per peak.
 */
export const usePhotoContest = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<PhotoEntry[]>([]);
  const [rounds, setRounds] = useState<Record<string, PhotoRound>>({});
  /** country_slug -> entry_id the member voted for. */
  const [myVotes, setMyVotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ entries: e, rounds: r }, votes] = await Promise.all([
      fetchContest(),
      user ? db.from("peak_photo_votes").select("entry_id, country_slug").eq("user_id", user.id) : Promise.resolve({ data: [] }),
    ]);
    setEntries(e);
    setRounds(r);
    const mine: Record<string, string> = {};
    (votes.data ?? []).forEach((v: { entry_id: string; country_slug: string }) => {
      mine[v.country_slug] = v.entry_id;
    });
    setMyVotes(mine);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Add a photo to a peak's contest. */
  const submitEntry = async (input: {
    countrySlug: string;
    country: string;
    peakName: string;
    photoUrl: string;
    caption?: string;
  }) => {
    if (!user) return false;
    const { error } = await db.from("peak_photo_entries").insert({
      user_id: user.id,
      country_slug: input.countrySlug,
      country: input.country,
      peak_name: input.peakName,
      photo_url: input.photoUrl,
      caption: input.caption?.trim() || null,
    });
    if (error) {
      toast({ title: "Could not add the photo", description: error.message, variant: "destructive" });
      return false;
    }
    await load();
    return true;
  };

  /** Cast or move the member's single vote for a peak. */
  const vote = async (entry: PhotoEntry) => {
    if (!user) return;
    const current = myVotes[entry.country_slug];
    if (current === entry.id) return;

    const { error } = current
      ? await db
          .from("peak_photo_votes")
          .update({ entry_id: entry.id })
          .eq("user_id", user.id)
          .eq("country_slug", entry.country_slug)
      : await db.from("peak_photo_votes").insert({
          user_id: user.id,
          entry_id: entry.id,
          country_slug: entry.country_slug,
        });

    if (error) {
      toast({ title: "Vote failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: current ? "Vote moved 🗳️" : "Vote counted 🗳️" });
    await load();
  };

  /** Edit the caption (and optionally the picture) of one of my entries. */
  const updateEntry = async (
    entry: PhotoEntry,
    patch: { caption?: string | null; photoUrl?: string },
  ) => {
    if (!user || entry.user_id !== user.id) return false;
    const payload: Record<string, unknown> = {};
    if (patch.caption !== undefined) payload['caption'] = patch.caption?.trim() || null;
    if (patch.photoUrl) payload['photo_url'] = patch.photoUrl;
    if (Object.keys(payload).length === 0) return true;

    const { error } = await db
      .from("peak_photo_entries")
      .update(payload)
      .eq("id", entry.id)
      .eq("user_id", user.id);
    if (error) {
      toast({ title: "Could not update the photo", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Photo updated ✏️" });
    await load();
    return true;
  };

  const removeEntry = async (entry: PhotoEntry) => {
    if (!user || entry.user_id !== user.id) return;
    const { error } = await db.from("peak_photo_entries").delete().eq("id", entry.id);
    if (error) {
      toast({ title: "Could not remove the photo", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Photo removed" });
    await load();
  };

  return { entries, rounds, myVotes, loading, reload: load, submitEntry, vote, updateEntry, removeEntry };
};

