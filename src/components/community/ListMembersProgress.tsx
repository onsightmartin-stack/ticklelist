import { Link } from "@/lib/router-compat";
import { Trophy } from "lucide-react";

import MemberAvatar from "@/components/community/MemberAvatar";
import { Progress } from "@/components/ui/progress";
import type { PeakList } from "@/data/peak-lists";
import type { PublicProfile } from "@/lib/community";

interface Props {
  list: PeakList;
  /** Climbed peak keys per member id. */
  byUser: Map<string, Set<string>>;
  profiles: Record<string, PublicProfile>;
  currentUserId: string | null;
}

const countFor = (list: PeakList, keys: Set<string> | undefined) =>
  keys ? list.entries.filter((e) => keys.has(e.key) || (e.alt ?? []).some((k) => keys.has(k))).length : 0;

/** Every member's standing on one challenge list, best first. */
const ListMembersProgress = ({ list, byUser, profiles, currentUserId }: Props) => {
  const total = list.entries.length;
  const rows = Object.values(profiles)
    .map((p) => ({ p, n: countFor(list, byUser.get(p.id)) }))
    .sort((a, b) => b.n - a.n || a.p.display_name.localeCompare(b.p.display_name));

  const active = rows.filter((r) => r.n > 0);
  if (active.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nobody has ticked a peak on this list yet — be the first.
      </p>
    );
  }

  return (
    <ol className="space-y-2">
      {active.map((r, i) => {
        const pct = Math.round((r.n / total) * 100);
        const isMe = r.p.id === currentUserId;
        return (
          <li key={r.p.id}>
            <Link
              to={`/community/members/${r.p.id}`}
              className={`flex items-center gap-3 rounded-lg border p-2 transition-colors hover:bg-muted/50 ${
                isMe ? "border-primary/60 bg-primary/5" : "border-border"
              }`}
            >
              <span className="w-5 shrink-0 text-center text-xs tabular-nums text-muted-foreground">
                {i + 1}
              </span>
              <MemberAvatar path={r.p.avatar_url} name={r.p.display_name} className="h-8 w-8 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm">{r.p.display_name}</span>
                  {isMe && <span className="text-[10px] uppercase tracking-wider text-primary">You</span>}
                  {r.n === total && <Trophy className="h-3.5 w-3.5 text-amber-400" />}
                </div>
                <Progress value={pct} className="mt-1 h-1.5" />
              </div>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {r.n}/{total}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
};

export default ListMembersProgress;
