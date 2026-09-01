import { supabase } from "@/integrations/supabase/client";

/** Length of a peak's photo contest, starting at the first vote cast. */
export const ROUND_DAYS = 30;

export interface PhotoEntry {
  id: string;
  user_id: string;
  country_slug: string;
  country: string;
  peak_name: string;
  photo_url: string;
  caption: string | null;
  created_at: string;
  votes: number;
}

export interface PhotoRound {
  country_slug: string;
  started_at: string;
  ends_at: string;
}

/** The Supabase client's generated types don't cover the contest tables yet. */
const db = supabase as unknown as {
  from: (table: string) => any;
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: any; error: any }>;
};

/** True once a round's 30 days have elapsed — the tally is then final. */
export const roundClosed = (round?: PhotoRound | null) =>
  !!round && new Date(round.ends_at).getTime() <= Date.now();

/** Whole days left in a round (0 when closed or not started). */
export const daysLeft = (round?: PhotoRound | null) => {
  if (!round) return null;
  const ms = new Date(round.ends_at).getTime() - Date.now();
  return ms <= 0 ? 0 : Math.ceil(ms / 86_400_000);
};

/** Most-voted entry; ties break to the earliest submission. */
export const leader = (entries: PhotoEntry[]): PhotoEntry | null => {
  const ranked = [...entries].sort(
    (a, b) => b.votes - a.votes || a.created_at.localeCompare(b.created_at),
  );
  const top = ranked[0];
  return top && top.votes > 0 ? top : null;
};

/** The confirmed winner — only once the round has closed. */
export const winnerOf = (entries: PhotoEntry[], round?: PhotoRound | null) =>
  roundClosed(round) ? leader(entries) : null;

interface ContestData {
  entries: PhotoEntry[];
  rounds: Record<string, PhotoRound>;
}

/** Load contest entries (with public tallies) and rounds, optionally for one peak. */
export const fetchContest = async (countrySlug?: string): Promise<ContestData> => {
  let entryQuery = db.from("peak_photo_entries").select("*").order("created_at", { ascending: true });
  let roundQuery = db.from("peak_photo_rounds").select("*");
  if (countrySlug) {
    entryQuery = entryQuery.eq("country_slug", countrySlug);
    roundQuery = roundQuery.eq("country_slug", countrySlug);
  }

  const [entryRes, roundRes] = await Promise.all([entryQuery, roundQuery]);

  const entries: PhotoEntry[] = (entryRes.data ?? []).map((e: PhotoEntry) => ({
    ...e,
    votes: Number(e.votes ?? 0),
  }));

  const rounds: Record<string, PhotoRound> = {};
  (roundRes.data ?? []).forEach((r: PhotoRound) => {
    rounds[r.country_slug] = r;
  });

  return { entries, rounds };
};


/** Winning photo URL for a peak page, or null while voting is still open. */
export const fetchWinnerPhoto = async (countrySlug: string): Promise<PhotoEntry | null> => {
  const { entries, rounds } = await fetchContest(countrySlug);
  return winnerOf(entries, rounds[countrySlug]);
};
