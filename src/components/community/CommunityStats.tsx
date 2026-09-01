import { isUnCountry } from "@/lib/profile-goals";
import { useMemo } from "react";
import { Link } from "@/lib/router-compat";

import { Mountain, Users, Flag, CalendarDays } from "lucide-react";
import { peakLists } from "@/data/peak-lists";
import type { Ascent } from "@/lib/peak-catalog";
import type { Adventure, PublicProfile } from "@/lib/community";

interface Props {
  ascents: Ascent[];
  adventures: Adventure[];
  profiles: Record<string, PublicProfile>;
}

const CommunityStats = ({ ascents, adventures, profiles }: Props) => {
  const stats = useMemo(() => {
    const climbers = new Set(ascents.map((a) => a.user_id));
    const highPoints = new Set(
      ascents
        .filter((a) => a.peak_type === "country_highpoint" && isUnCountry(a.country ?? a.peak_name))
        .map((a) => a.country ?? a.peak_name),
    );

    const keysByUser = new Map<string, Set<string>>();
    for (const a of ascents) {
      if (!keysByUser.has(a.user_id)) keysByUser.set(a.user_id, new Set());
      keysByUser.get(a.user_id)!.add(
        a.peak_type === "country_highpoint" ? `hp:${a.country ?? a.peak_name}` : `fp:${a.peak_name}`,
      );
    }
    let listsCompleted = 0;
    for (const keys of keysByUser.values()) {
      for (const list of peakLists) {
        const done = list.entries.every(
          (e) => keys.has(e.key) || (e.alt ?? []).some((k) => keys.has(k)),
        );
        if (done) listsCompleted += 1;
      }
    }

    return {
      members: Math.max(Object.keys(profiles).length, climbers.size),
      ascents: ascents.length,
      highPoints: highPoints.size,
      adventures: adventures.length,
      listsCompleted,
    };
  }, [ascents, adventures, profiles]);

  const items = [
    { icon: Users, label: "Members", value: stats.members, to: "/community/members" },
    { icon: Mountain, label: "Ascents logged", value: stats.ascents, to: "/community/ascents" },
    { icon: Flag, label: "UN high points covered", value: `${stats.highPoints}/193`, to: "/community/lists" },
    { icon: CalendarDays, label: "Adventures", value: stats.adventures, to: "/community/adventures" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map(({ icon: Icon, label, value, to }) => (
        <Link
          key={label}
          to={to}
          className="rounded-lg border border-border bg-card p-4 block transition-colors hover:border-primary/60 active:border-primary"
        >
          <Icon className="w-4 h-4 text-primary mb-2" />
          <p className="font-display text-xl tracking-wider tabular-nums">{value}</p>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground mt-1">{label}</p>
        </Link>
      ))}
    </div>
  );

};

export default CommunityStats;
