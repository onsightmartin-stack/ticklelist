import { useMemo, useState } from "react";
import { Check, Circle, ListPlus, Mountain, Trophy, TrendingUp } from "lucide-react";

import Seo from "@/components/Seo";
import { Link } from "@/lib/router-compat";
import CommunityLayout from "@/components/community/CommunityLayout";
import MembersOnly from "@/components/community/MembersOnly";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useCommunityData } from "@/hooks/useCommunityData";
import { useDynamicPeakList, usePeakCountries, type DynamicPeak } from "@/hooks/useDynamicPeakList";
import { useUnits } from "@/hooks/useUnits";
import { formatElevation } from "@/lib/units";
import { xpForAscent, formatXp } from "@/lib/xp";
import { cn } from "@/lib/utils";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const peakXp = (peak: DynamicPeak) =>
  xpForAscent({
    peak_type: "famous_peak",
    country: null,
    peak_name: peak.name,
    elevation: peak.elevation ? `${peak.elevation} m` : null,
  }).xp;

const presets: { label: string; minElevation: number | null; minProminence: number | null }[] = [
  { label: "P600 ultras-lite", minElevation: null, minProminence: 600 },
  { label: "P1500 ultras", minElevation: null, minProminence: 1500 },
  { label: "2000 m+", minElevation: 2000, minProminence: null },
  { label: "4000 m+", minElevation: 4000, minProminence: null },
  { label: "Everything big (3000 m + P300)", minElevation: 3000, minProminence: 300 },
];

const ListBuilderPage = () => {
  const { user } = useAuth();
  const units = useUnits();
  const countries = usePeakCountries();
  const { ascents } = useCommunityData();

  const [country, setCountry] = useState<string>("");
  const [minElevation, setMinElevation] = useState<string>("1000");
  const [minProminence, setMinProminence] = useState<string>("600");
  const [sort, setSort] = useState<"elevation" | "prominence">("prominence");
  const [limit, setLimit] = useState(50);

  const query = useMemo(
    () => ({
      country: country || null,
      minElevation: Number(minElevation) > 0 ? Number(minElevation) : null,
      minProminence: Number(minProminence) > 0 ? Number(minProminence) : null,
      sort,
      limit,
    }),
    [country, minElevation, minProminence, sort, limit],
  );

  const { peaks, total, loading, error } = useDynamicPeakList(query);

  const climbedNames = useMemo(() => {
    const set = new Set<string>();
    ascents.filter((a) => a.user_id === user?.id).forEach((a) => set.add(norm(a.peak_name)));
    return set;
  }, [ascents, user?.id]);

  const rows = useMemo(
    () => peaks.map((p) => ({ peak: p, done: climbedNames.has(norm(p.name)), xp: peakXp(p) })),
    [peaks, climbedNames],
  );

  const doneCount = rows.filter((r) => r.done).length;
  const earnedXp = rows.filter((r) => r.done).reduce((sum, r) => sum + r.xp, 0);
  const totalXp = rows.reduce((sum, r) => sum + r.xp, 0);
  const pct = rows.length ? Math.round((doneCount / rows.length) * 100) : 0;

  const countryLabel = countries.find((c) => c.code === country)?.name ?? "the world";
  const listTitle = `${
    query.minProminence ? `P${query.minProminence} ` : ""
  }${query.minElevation ? `${query.minElevation} m+ ` : ""}peaks of ${countryLabel}`;

  return (
    <CommunityLayout>
      <Seo
        title="Peak list builder | Ticklelist"
        description="Build your own live peak list — pick a country, minimum height and minimum prominence, and track your progress and XP against it."
        path="/community/list-builder"
      />
      {!user ? (
        <div className="px-4 py-10">
          <MembersOnly />
        </div>
      ) : (
        <div className="mx-auto max-w-4xl px-4 py-8">
          <header className="mb-6">
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <ListPlus className="h-6 w-6 text-primary" /> List builder
            </h1>
            <p className="mt-1 text-muted-foreground">
              Generate any challenge you like from the 1.3 million peak catalogue — country, height
              and prominence — then track it live. Prominence data is still being backfilled
              worldwide, so height filters cover more peaks right now.
            </p>
          </header>

          <section className="rounded-lg border border-border bg-card/60 p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-sm">
                <span className="mb-1 block text-muted-foreground">Country</span>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                >
                  <option value="">Worldwide</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm">
                <span className="mb-1 block text-muted-foreground">Min elevation (m)</span>
                <Input
                  type="number"
                  min={0}
                  value={minElevation}
                  onChange={(e) => setMinElevation(e.target.value)}
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block text-muted-foreground">Min prominence (m)</span>
                <Input
                  type="number"
                  min={0}
                  value={minProminence}
                  onChange={(e) => setMinProminence(e.target.value)}
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block text-muted-foreground">Rank by</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as "elevation" | "prominence")}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                >
                  <option value="prominence">Prominence</option>
                  <option value="elevation">Elevation</option>
                </select>
              </label>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {presets.map((p) => (
                <Button
                  key={p.label}
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setMinElevation(p.minElevation ? String(p.minElevation) : "0");
                    setMinProminence(p.minProminence ? String(p.minProminence) : "0");
                  }}
                >
                  {p.label}
                </Button>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>Show top</span>
              {[25, 50, 100, 200, 300].map((n) => (
                <button
                  key={n}
                  onClick={() => setLimit(n)}
                  className={cn(
                    "rounded-md border border-border px-2 py-1",
                    limit === n ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-lg border border-border bg-card/60 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold text-foreground">{listTitle}</h2>
              <span className="text-sm text-muted-foreground">
                {loading
                  ? "Building…"
                  : `${rows.length} shown of ${total >= 5000 ? "5,000+" : total.toLocaleString()} matching peaks`}
              </span>
            </div>
            <Progress value={pct} className="mt-3" />
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Check className="h-4 w-4 text-primary" /> {doneCount}/{rows.length} climbed ({pct}%)
              </span>
              <span className="flex items-center gap-1">
                <Trophy className="h-4 w-4 text-primary" /> {formatXp(earnedXp)} XP earned ·{" "}
                {formatXp(totalXp)} XP on the table
              </span>
            </div>
          </section>

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

          <ul className="mt-4 space-y-2">
            {rows.map(({ peak, done, xp }, i) => (
              <li
                key={peak.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3",
                  done ? "border-primary/40 bg-primary/5" : "border-border bg-card/60",
                )}
              >
                <span className="w-7 shrink-0 text-right text-xs text-muted-foreground">
                  {i + 1}
                </span>
                {done ? (
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/peaks/${peak.id}`}
                    className="font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {peak.name}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {[peak.admin1, peak.countryCode].filter(Boolean).join(", ") || "—"}
                  </div>
                </div>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Mountain className="h-3.5 w-3.5" />
                  {formatElevation(peak.elevation, units) ?? "—"}
                </span>
                <span className="hidden items-center gap-1 text-sm text-muted-foreground sm:flex">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {formatElevation(peak.prominence, units) ?? "—"}
                </span>
                <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
                  {formatXp(xp)} XP
                </span>
              </li>
            ))}
          </ul>

          {!loading && rows.length === 0 && (
            <p className="mt-6 text-center text-muted-foreground">
              No peaks match those filters yet — lower the prominence bar or pick another country.
            </p>
          )}
        </div>
      )}
    </CommunityLayout>
  );
};

export default ListBuilderPage;
