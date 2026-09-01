import { computeGoals, goalDefs, type GoalDef } from "@/lib/profile-goals";
import type { Ascent } from "@/lib/peak-catalog";
import type { Visit } from "@/data/places";
import type { PublicProfile } from "@/lib/community";

/** Every board a member can be ranked on — same roster as profile goals. */
export const frontRunnerBoards: GoalDef[] = goalDefs;

export const boardById = (id: string) => frontRunnerBoards.find((b) => b.id === id);

/** Link to the front runners board for one list, challenge or counter. */
export const frontRunnersHref = (boardId: string) =>
  `/community/frontrunners?board=${encodeURIComponent(boardId)}`;

export const listBoardId = (listId: string) => `list:${listId}`;
export const challengeBoardId = (challengeId: string) => `challenge:${challengeId}`;

export interface FrontRunnerRow {
  profile: PublicProfile;
  done: number;
  total: number | null;
  /** Dense rank — members on the same score share a place. */
  rank: number;
}

interface BuildArgs {
  boardId: string;
  profiles: Record<string, PublicProfile>;
  ascents: Ascent[];
  visits: Visit[];
}

/** Rank every member on one board, best first, with ties sharing a rank. */
export function buildFrontRunners({ boardId, profiles, ascents, visits }: BuildArgs): FrontRunnerRow[] {
  const ascentsBy = new Map<string, Ascent[]>();
  for (const a of ascents) {
    const arr = ascentsBy.get(a.user_id);
    if (arr) arr.push(a);
    else ascentsBy.set(a.user_id, [a]);
  }
  const visitsBy = new Map<string, Visit[]>();
  for (const v of visits) {
    const arr = visitsBy.get(v.user_id);
    if (arr) arr.push(v);
    else visitsBy.set(v.user_id, [v]);
  }

  const scored = Object.values(profiles).map((profile) => {
    const progress = computeGoals(
      [boardId],
      ascentsBy.get(profile.id) ?? [],
      visitsBy.get(profile.id) ?? [],
    )[0];
    return { profile, done: progress?.done ?? 0, total: progress?.total ?? null };
  });

  scored.sort(
    (a, b) => b.done - a.done || a.profile.display_name.localeCompare(b.profile.display_name),
  );

  let rank = 0;
  let lastScore: number | null = null;
  return scored.map((row, i) => {
    if (lastScore === null || row.done !== lastScore) {
      rank = i + 1;
      lastScore = row.done;
    }
    return { ...row, rank };
  });
}
