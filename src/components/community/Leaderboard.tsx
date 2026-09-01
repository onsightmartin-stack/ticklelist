import { useState } from "react";
import { Trophy, Compass } from "lucide-react";
import MemberAvatar from "@/components/community/MemberAvatar";
import { buildLeaderboard, type Ascent } from "@/lib/peak-catalog";
import type { PublicProfile } from "@/lib/community";
import { computeXp, formatXp } from "@/lib/xp";
import { computeExplorerXp } from "@/lib/explorer-xp";
import type { Visit } from "@/data/places";
import { Link } from "@/lib/router-compat";
import { cn } from "@/lib/utils";

interface LeaderboardProps {
  ascents: Ascent[];
  visits: Visit[];
  profiles: Record<string, PublicProfile>;
  currentUserId: string | null;
}

const medal = ["text-primary", "text-foreground", "text-muted-foreground"];

type Tab = "climber" | "explorer";

const Leaderboard = ({ ascents, visits, profiles, currentUserId }: LeaderboardProps) => {
  const [tab, setTab] = useState<Tab>("climber");

  const publicAscents = ascents.filter((a) => a.is_public);
  const publicVisits = visits.filter((v) => v.is_public);

  // Climber rows — ranked by summit XP.
  const climberRows = (() => {
    const xpByUser = new Map<string, ReturnType<typeof computeXp>>();
    for (const a of publicAscents) {
      if (!xpByUser.has(a.user_id)) {
        xpByUser.set(a.user_id, computeXp(publicAscents.filter((x) => x.user_id === a.user_id)));
      }
    }
    return buildLeaderboard(publicAscents)
      .map((r) => ({ r, xp: xpByUser.get(r.userId)?.total ?? 0 }))
      .sort((a, b) => b.xp - a.xp);
  })();

  // Explorer rows — ranked by explorer XP.
  const explorerRows = (() => {
    const xpByUser = new Map<string, ReturnType<typeof computeExplorerXp>>();
    for (const v of publicVisits) {
      if (!xpByUser.has(v.user_id)) {
        xpByUser.set(v.user_id, computeExplorerXp(publicVisits.filter((x) => x.user_id === v.user_id)));
      }
    }
    return [...xpByUser.entries()]
      .map(([userId, summary]) => ({ userId, summary }))
      .filter((row) => row.summary.total > 0)
      .sort((a, b) => b.summary.total - a.summary.total);
  })();

  const rows = tab === "climber" ? climberRows.length : explorerRows.length;

  if (rows === 0) {
    return (
      <div>
        <Tabs tab={tab} setTab={setTab} />
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <h2 className="font-display tracking-wider text-lg">
            {tab === "climber" ? "No ranked ascents yet" : "No ranked explorers yet"}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            {tab === "climber"
              ? "Log a public ascent and you'll appear on the board."
              : "Tick a public country, wonder or landmark and you'll appear on the board."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
        {tab === "climber" ? (
          <>
            <Trophy className="w-4 h-4 text-primary" />
            <h2 className="font-display tracking-wider text-lg">Climber Leaderboard</h2>
            <span className="text-xs text-muted-foreground ml-auto">Ranked by summit XP</span>
          </>
        ) : (
          <>
            <Compass className="w-4 h-4 text-primary" />
            <h2 className="font-display tracking-wider text-lg">Explorer Leaderboard</h2>
            <span className="text-xs text-muted-foreground ml-auto">Ranked by explorer XP</span>
          </>
        )}
      </div>
      <Tabs tab={tab} setTab={setTab} compact />
      <ul>
        {tab === "climber"
          ? climberRows.map(({ r, xp }, i) => {
              const p = profiles[r.userId];
              return (
                <li key={r.userId} className="border-b border-border last:border-0">
                  <Link
                    to={`/community/members/${r.userId}`}
                    className={cn(
                      "flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/50",
                      r.userId === currentUserId && "bg-secondary/40",
                    )}
                  >
                    <span className={cn("w-6 font-display tracking-wider", medal[i] ?? "text-muted-foreground")}>
                      {i + 1}
                    </span>
                    <MemberAvatar path={p?.avatar_url ?? null} name={p?.display_name ?? "Member"} />
                    <div className="min-w-0">
                      <p className="text-sm truncate">{p?.display_name ?? "Member"}</p>
                      {p?.country && <p className="text-xs text-muted-foreground truncate">{p.country}</p>}
                    </div>
                    <div className="ml-auto text-right">
                      <p className="font-display tracking-wider text-primary">{formatXp(xp)} XP</p>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        {r.highPoints} HP · {r.famous} famous
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })
          : explorerRows.map((row, i) => {
              const p = profiles[row.userId];
              const s = row.summary;
              return (
                <li key={row.userId} className="border-b border-border last:border-0">
                  <Link
                    to={`/community/members/${row.userId}`}
                    className={cn(
                      "flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/50",
                      row.userId === currentUserId && "bg-secondary/40",
                    )}
                  >
                    <span className={cn("w-6 font-display tracking-wider", medal[i] ?? "text-muted-foreground")}>
                      {i + 1}
                    </span>
                    <MemberAvatar path={p?.avatar_url ?? null} name={p?.display_name ?? "Member"} />
                    <div className="min-w-0">
                      <p className="text-sm truncate">{p?.display_name ?? "Member"}</p>
                      {p?.country && <p className="text-xs text-muted-foreground truncate">{p.country}</p>}
                    </div>
                    <div className="ml-auto text-right">
                      <p className="font-display tracking-wider text-primary">{formatXp(s.total)} XP</p>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        {s.countries} countries · {s.places} places
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
      </ul>
    </div>
  );
};

interface TabsProps {
  tab: Tab;
  setTab: (t: Tab) => void;
  compact?: boolean;
}

const Tabs = ({ tab, setTab, compact }: TabsProps) => (
  <div className={cn("flex gap-1 border-b border-border", compact ? "px-3 pt-2" : "px-5 py-3")}>
    <button
      type="button"
      onClick={() => setTab("climber")}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-display tracking-wider uppercase transition-colors rounded-t",
        tab === "climber"
          ? "text-primary border-b-2 border-primary -mb-px"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Trophy className="w-3.5 h-3.5" /> Climbers
    </button>
    <button
      type="button"
      onClick={() => setTab("explorer")}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-display tracking-wider uppercase transition-colors rounded-t",
        tab === "explorer"
          ? "text-primary border-b-2 border-primary -mb-px"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Compass className="w-3.5 h-3.5" /> Explorers
    </button>
  </div>
);

export default Leaderboard;
