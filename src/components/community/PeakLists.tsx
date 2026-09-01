import { useMemo, useState } from "react";
import { Check, ChevronDown, Circle, List, Map as MapIcon, Trophy, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { peakLists, type PeakList } from "@/data/peak-lists";
import { findPeak, type Ascent } from "@/lib/peak-catalog";
import type { PublicProfile } from "@/lib/community";
import LazyListMap from "@/components/community/LazyListMap";
import ListMembersProgress from "@/components/community/ListMembersProgress";
import { Link } from "@/lib/router-compat";
import { frontRunnersHref, listBoardId } from "@/lib/frontrunners";

interface Props {
  ascents: Ascent[];
  profiles: Record<string, PublicProfile>;
  currentUserId: string | null;
}

const keysForUser = (ascents: Ascent[]) => {
  const set = new Set<string>();
  for (const a of ascents) {
    set.add(
      a.peak_type === "country_highpoint"
        ? `hp:${a.country ?? a.peak_name}`
        : `fp:${a.peak_name}`,
    );
  }
  return set;
};

const doneCount = (list: PeakList, keys: Set<string>) =>
  list.entries.filter((e) => keys.has(e.key) || (e.alt ?? []).some((k) => keys.has(k))).length;

const PeakLists = ({ ascents, profiles, currentUserId }: Props) => {
  const [open, setOpen] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "map" | "members">("list");

  const byUser = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const a of ascents) {
      if (!map.has(a.user_id)) map.set(a.user_id, new Set());
      map.get(a.user_id)!.add(
        a.peak_type === "country_highpoint" ? `hp:${a.country ?? a.peak_name}` : `fp:${a.peak_name}`,
      );
    }
    return map;
  }, [ascents]);

  const myKeys = useMemo(
    () => keysForUser(currentUserId ? ascents.filter((a) => a.user_id === currentUserId) : []),
    [ascents, currentUserId],
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Tick lists to chase — Seven Summits, the Volcanic Seven, the 8000ers, EU member states and
        more. Log an ascent and it counts automatically.
      </p>

      {peakLists.map((list) => {
        const done = doneCount(list, myKeys);
        const total = list.entries.length;
        const pct = Math.round((done / total) * 100);
        const isOpen = open === list.id;

        const leaders = [...byUser.entries()]
          .map(([userId, keys]) => ({ userId, n: doneCount(list, keys) }))
          .filter((r) => r.n > 0)
          .sort((a, b) => b.n - a.n)
          .slice(0, 3);

        return (
          <div key={list.id} className="rounded-lg border border-border bg-card">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : list.id)}
              className="w-full text-left p-4 flex items-start gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display tracking-wider">{list.name}</h3>
                  <Badge variant="secondary" className="text-[10px]">{list.category}</Badge>
                  {done === total && (
                    <Badge className="text-[10px]"><Trophy className="w-3 h-3 mr-1" /> Complete</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{list.blurb}</p>
                <div className="mt-3 flex items-center gap-3">
                  <Progress value={pct} className="h-2 flex-1" />
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {done}/{total}
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 mt-1 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            <div className="px-4 pb-3 -mt-2">
              <Link
                to={frontRunnersHref(listBoardId(list.id))}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Trophy className="w-3 h-3" /> Front runners
              </Link>
            </div>

            {isOpen && (
              <div className="px-4 pb-4 space-y-3">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={view === "list" ? "default" : "secondary"}
                    onClick={() => setView("list")}
                  >
                    <List className="w-3.5 h-3.5 mr-1.5" /> List
                  </Button>
                  <Button
                    size="sm"
                    variant={view === "map" ? "default" : "secondary"}
                    onClick={() => setView("map")}
                  >
                    <MapIcon className="w-3.5 h-3.5 mr-1.5" /> Map
                  </Button>
                  <Button
                    size="sm"
                    variant={view === "members" ? "default" : "secondary"}
                    onClick={() => setView("members")}
                  >
                    <Users className="w-3.5 h-3.5 mr-1.5" /> Members
                  </Button>
                </div>

                {view === "members" && (
                  <ListMembersProgress
                    list={list}
                    byUser={byUser}
                    profiles={profiles}
                    currentUserId={currentUserId}
                  />
                )}

                {view === "map" && <LazyListMap list={list} climbedKeys={myKeys} />}

                {view === "list" && (
                <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
                  {list.entries.map((e) => {
                    const peak = findPeak(e.key);
                    const ticked = myKeys.has(e.key) || (e.alt ?? []).some((k) => myKeys.has(k));
                    return (
                      <li key={e.key} className="flex items-center gap-2 text-sm py-1">
                        {ticked ? (
                          <Check className="w-4 h-4 text-primary shrink-0" />
                        ) : (
                          <Circle className="w-3 h-3 text-muted-foreground shrink-0" />
                        )}
                        <span className={ticked ? "" : "text-muted-foreground"}>
                          {peak
                            ? peak.type === "country_highpoint"
                              ? `${peak.country} — ${peak.name}`
                              : peak.name
                            : e.key.slice(3)}
                        </span>
                        {peak?.elevation && (
                          <span className="text-xs text-muted-foreground ml-auto tabular-nums">
                            {peak.elevation}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                )}

                {leaders.length > 0 && (
                  <div className="text-xs text-muted-foreground border-t border-border pt-3">
                    Leaders:{" "}
                    {leaders
                      .map((l) => `${profiles[l.userId]?.display_name ?? "Climber"} (${l.n}/${total})`)
                      .join(" · ")}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {!currentUserId && (
        <Button variant="secondary" asChild className="w-full">
          <a href="/auth">Sign in to track your progress</a>
        </Button>
      )}
    </div>
  );
};

export default PeakLists;
