import { useMemo } from "react";
import { countries } from "@/data/countries";
import { peakLists } from "@/data/peak-lists";
import { findPeak, type Ascent } from "@/lib/peak-catalog";

interface Props {
  /** Ascents of the viewing member — logged summits count as climbed. */
  ascents: Ascent[];
}

const statusByCountry = new Map(countries.map((c) => [c.country, c.status]));

const climbedStatuses = new Set(["climbed", "mainland_climbed", "legal_high_point"]);

/**
 * Per challenge list: how many entries are summited, how many are in a country
 * that has been visited but not summited, and how many are still untouched.
 */
const ListProgressDashboard = ({ ascents }: Props) => {
  const myKeys = useMemo(() => {
    const set = new Set<string>();
    for (const a of ascents) {
      set.add(
        a.peak_type === "country_highpoint"
          ? `hp:${a.country ?? a.peak_name}`
          : `fp:${a.peak_name}`,
      );
    }
    return set;
  }, [ascents]);

  const rows = useMemo(
    () =>
      peakLists.map((list) => {
        let climbed = 0;
        let visited = 0;

        for (const e of list.entries) {
          const ticked = myKeys.has(e.key) || (e.alt ?? []).some((k) => myKeys.has(k));
          if (ticked) {
            climbed += 1;
            continue;
          }
          const peak = findPeak(e.key);
          const country = peak?.country ?? (e.key.startsWith("hp:") ? e.key.slice(3) : null);
          const status = country ? statusByCountry.get(country) : undefined;
          if (status && (status === "visited" || climbedStatuses.has(status))) visited += 1;
        }

        const total = list.entries.length;
        return { list, climbed, visited, remaining: total - climbed - visited, total };
      }),
    [myKeys],
  );

  const totals = rows.reduce(
    (acc, r) => ({
      climbed: acc.climbed + r.climbed,
      visited: acc.visited + r.visited,
      remaining: acc.remaining + r.remaining,
      total: acc.total + r.total,
    }),
    { climbed: 0, visited: 0, remaining: 0, total: 0 },
  );

  const Bar = ({ climbed, visited, remaining, total }: { climbed: number; visited: number; remaining: number; total: number }) => (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="bg-primary" style={{ width: `${(climbed / total) * 100}%` }} />
      <div className="bg-summit opacity-70" style={{ width: `${(visited / total) * 100}%` }} />
      <div className="bg-muted" style={{ width: `${(remaining / total) * 100}%` }} />
    </div>
  );

  return (
    <section className="rounded-lg border border-border bg-card p-4 mb-6">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="font-display tracking-wider">Progress dashboard</h2>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" /> Climbed {totals.climbed}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-summit opacity-70 inline-block" /> Visited {totals.visited}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-muted inline-block" /> Remaining {totals.remaining}
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-1">
        Climbed = summit logged. Visited = you&apos;ve been to that country but the peak is still open.
      </p>

      <div className="mt-4 space-y-3">
        {rows.map((r) => (
          <div key={r.list.id} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 items-center">
            <span className="text-sm truncate">{r.list.name}</span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {r.climbed} · {r.visited} · {r.remaining} / {r.total}
            </span>
            <div className="col-span-2">
              <Bar {...r} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ListProgressDashboard;
