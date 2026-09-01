import { useMemo, useState } from "react";
import { Medal, Search, Trophy } from "lucide-react";

import Seo from "@/components/Seo";
import CommunityLayout from "@/components/community/CommunityLayout";
import MembersOnly from "@/components/community/MembersOnly";
import MemberAvatar from "@/components/community/MemberAvatar";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Link, useSearchParams } from "@/lib/router-compat";
import { useAuth } from "@/hooks/useAuth";
import { useCommunityData } from "@/hooks/useCommunityData";
import { useVisits } from "@/hooks/useVisits";
import { buildFrontRunners, frontRunnerBoards, boardById } from "@/lib/frontrunners";
import { fuzzyFieldScore } from "@/lib/fuzzy";
import { cn } from "@/lib/utils";

const DEFAULT_BOARD = "un-highpoints";

const medalClass = (rank: number) =>
  rank === 1 ? "text-amber-400" : rank === 2 ? "text-slate-300" : rank === 3 ? "text-orange-400" : "";

const FrontRunnersPage = () => {
  const { user } = useAuth();
  const { ascents, profiles, fetching } = useCommunityData();
  const { visits } = useVisits();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");

  const boardId = params.get("board") ?? DEFAULT_BOARD;
  const board = boardById(boardId) ?? boardById(DEFAULT_BOARD)!;

  const groups = useMemo(() => {
    const map = new Map<string, typeof frontRunnerBoards>();
    for (const b of frontRunnerBoards) {
      if (!map.has(b.group)) map.set(b.group, []);
      map.get(b.group)!.push(b);
    }
    return [...map.entries()];
  }, []);

  const rows = useMemo(
    () => buildFrontRunners({ boardId: board.id, profiles, ascents, visits }),
    [board.id, profiles, ascents, visits],
  );

  const mine = user ? rows.find((r) => r.profile.id === user.id) : undefined;
  const ranked = rows.filter((r) => r.done > 0);
  const shown = query.trim()
    ? ranked.filter((r) => Number.isFinite(fuzzyFieldScore(query, r.profile.display_name)))
    : ranked;

  if (!user) {
    return (
      <CommunityLayout>
        <Seo title="Front Runners — Ticklelist" description="See who leads every challenge list, high point mission and travel counter." noindex />
        <MembersOnly
          title="Front runners are members only"
          description="Sign in to see the ranking on every list — and where you stand."
        />
      </CommunityLayout>
    );
  }

  return (
    <CommunityLayout>
      <Seo title="Front Runners — Ticklelist" description="Rankings for every challenge list, high point mission and travel counter." noindex />

      <div className="flex items-center gap-2 mb-1">
        <Trophy className="w-5 h-5 text-primary" />
        <h1 className="font-display text-2xl tracking-wider">Front runners</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Pick any list, challenge or counter and see who leads it — and your own place in the pack.
      </p>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,14rem)] mb-5">
        <select
          value={board.id}
          onChange={(e) => setParams({ board: e.target.value }, { replace: true })}
          aria-label="Ranking board"
          className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
        >
          {groups.map(([group, items]) => (
            <optgroup key={group} label={group}>
              {items.map((b) => (
                <option key={b.id} value={b.id}>{b.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a member…"
            className="pl-9"
          />
        </div>
      </div>

      {mine && (
        <div className="mb-5 rounded-lg border border-primary/60 bg-primary/5 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-display">Your standing</p>
          <p className="font-display text-lg tracking-wider mt-1">
            {mine.done > 0 ? `#${mine.rank} of ${ranked.length}` : "Not on the board yet"}
            <span className="text-muted-foreground text-sm font-sans tracking-normal">
              {" "}· {mine.done}
              {mine.total !== null ? `/${mine.total}` : ""} on {board.label}
            </span>
          </p>
        </div>
      )}

      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {fetching ? "Loading rankings…" : "Nobody has ticked anything on this board yet — be the first."}
        </p>
      ) : (
        <ol className="space-y-2">
          {shown.map((r) => {
            const isMe = r.profile.id === user.id;
            const pct = r.total ? Math.round((r.done / r.total) * 100) : 100;
            return (
              <li key={r.profile.id}>
                <Link
                  to={`/community/members/${r.profile.id}`}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-2 transition-colors hover:bg-muted/50",
                    isMe ? "border-primary/60 bg-primary/5" : "border-border",
                  )}
                >
                  <span className={cn("w-7 shrink-0 text-center text-sm tabular-nums font-display", medalClass(r.rank))}>
                    {r.rank <= 3 ? <Medal className={cn("mx-auto h-4 w-4", medalClass(r.rank))} /> : r.rank}
                  </span>
                  <MemberAvatar path={r.profile.avatar_url} name={r.profile.display_name} className="h-8 w-8 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm">{r.profile.display_name}</span>
                      {isMe && <span className="text-[10px] uppercase tracking-wider text-primary">You</span>}
                      {r.total !== null && r.done === r.total && <Trophy className="h-3.5 w-3.5 text-amber-400" />}
                    </div>
                    {r.total !== null && <Progress value={pct} className="mt-1 h-1.5" />}
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {r.done}
                    {r.total !== null ? `/${r.total}` : ""}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </CommunityLayout>
  );
};

export default FrontRunnersPage;
