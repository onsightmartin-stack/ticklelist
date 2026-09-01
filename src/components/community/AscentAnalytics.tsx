import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, X } from "lucide-react";
import { computeAscentStats, difficultyLabels, difficultyOrder, seasonFor, type Season } from "@/lib/ascent-stats";
import { formatAscentDate, type Ascent } from "@/lib/peak-catalog";
import { formatXp, parseElevation } from "@/lib/xp";
import { cn } from "@/lib/utils";

const STAT_LABELS: Record<string, string> = {
  total: "Total ascents",
  repeats: "Repeat ascents",
  highPoints: "Country high points",
  famous: "Famous peaks",
  metres: "Summit metres — highest first",
  average: "All ascents by height",
  perYear: "All ascents",
  xp: "All ascents by height",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SEASONS: Season[] = ["Winter", "Spring", "Summer", "Autumn"];

/** One line of the expanded detail list under a stat box. */
const AscentLine = ({ ascent }: { ascent: Ascent }) => (
  <li className="flex items-center gap-2 text-sm">
    <span className="truncate">{ascent.peak_name}</span>
    {ascent.country && <span className="text-xs text-muted-foreground shrink-0">{ascent.country}</span>}
    <span className="ml-auto text-xs text-muted-foreground shrink-0">
      {formatAscentDate(ascent.ascent_date, ascent.date_precision ?? "day")}
    </span>
  </li>
);

const Stat = ({
  label,
  value,
  hint,
  details,
  open,
  onToggle,
}: {
  label: string;
  value: string;
  hint?: string | undefined;
  details?: Ascent[] | undefined;
  open?: boolean;
  onToggle?: (() => void) | undefined;
}) => {
  const expandable = !!details && details.length > 0 && !!onToggle;
  return (
    <button
      type="button"
      disabled={!expandable}
      aria-expanded={expandable ? !!open : undefined}
      onClick={onToggle}
      className={cn(
        "rounded-lg border bg-card/60 p-4 text-left w-full transition-colors",
        open ? "border-primary" : "border-border",
        expandable ? "cursor-pointer hover:border-primary/60" : "cursor-default",
      )}
    >
      <div className="text-2xl font-display tracking-wide">{value}</div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1 flex items-center gap-1">
        <span className="min-w-0 truncate">{label}</span>
        {expandable && <ChevronDown className={cn("w-3 h-3 shrink-0 transition-transform", open && "rotate-180")} />}
      </div>
      {hint && <div className="text-xs text-muted-foreground/80 mt-1">{hint}</div>}
    </button>
  );
};

/** The expanded panel shown under a grid of stat boxes. */
const StatDetails = ({ title, items }: { title: string; items: Ascent[] }) => (
  <div className="mt-3 rounded-lg border border-border bg-card p-4">
    <p className="font-display text-sm tracking-wider mb-2">
      {title} <span className="text-muted-foreground">· {items.length}</span>
    </p>
    <ul className="max-h-72 overflow-y-auto grid sm:grid-cols-2 gap-x-4 gap-y-1 pr-1">
      {items.map((a) => (
        <AscentLine key={a.id} ascent={a} />
      ))}
    </ul>
  </div>
);

const Bar = ({ label, count, max, note }: { label: string; count: number; max: number; note?: string }) => (
  <div className="flex items-center gap-3 text-sm">
    <div className="w-28 shrink-0 text-muted-foreground">{label}</div>
    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
      <div className="h-full bg-primary" style={{ width: `${max ? (count / max) * 100 : 0}%` }} />
    </div>
    <div className="w-16 text-right tabular-nums">
      {count}
      {note && <span className="text-muted-foreground text-xs ml-1">{note}</span>}
    </div>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <h3 className="font-display text-sm uppercase tracking-wider text-muted-foreground">{title}</h3>
    {children}
  </div>
);

const m = (v: number) => `${Math.round(v).toLocaleString()} m`;

const AscentAnalytics = ({ ascents, onClose }: { ascents: Ascent[]; onClose: () => void }) => {
  const s = useMemo(() => computeAscentStats(ascents), [ascents]);
  const [open, setOpen] = useState<string | null>(null);

  const byElevation = useMemo(
    () => [...ascents].sort((a, b) => (parseElevation(b.elevation) ?? 0) - (parseElevation(a.elevation) ?? 0)),
    [ascents],
  );
  const details = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of ascents) counts.set(a.peak_name, (counts.get(a.peak_name) ?? 0) + 1);
    return {
      total: ascents,
      repeats: ascents.filter((a) => (counts.get(a.peak_name) ?? 0) > 1),
      highPoints: ascents.filter((a) => a.peak_type === "country_highpoint"),
      famous: ascents.filter((a) => a.peak_type === "famous_peak"),
      metres: byElevation,
      average: byElevation,
      perYear: ascents,
      xp: byElevation,
    } as Record<string, Ascent[]>;
  }, [ascents, byElevation]);

  const seasonAscents = useMemo(() => {
    const map: Record<string, Ascent[]> = {};
    for (const a of ascents) (map[seasonFor(a)] ??= []).push(a);
    return map;
  }, [ascents]);

  const statProps = (id: string) => ({
    details: details[id],
    open: open === id,
    onToggle: () => setOpen(open === id ? null : id),
  });


  if (s.total === 0) {
    return (
      <div className="rounded-lg border border-border p-6">
        <p className="text-sm text-muted-foreground">Log an ascent and your analytics will appear here.</p>
      </div>
    );
  }

  const maxBand = Math.max(...s.bands.map((b) => b.count), 1);
  const maxMonth = Math.max(...s.months, 1);
  const maxYear = Math.max(...s.years.map((y) => y.count), 1);
  const maxDiff = Math.max(...difficultyOrder.map((d) => s.difficulty[d]), 1);

  return (
    <div className="rounded-lg border border-border p-5 sm:p-6 space-y-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg tracking-wider uppercase">My ascent analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Everything you have logged, sliced by altitude, season, difficulty and time.
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close analytics">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Total ascents" value={String(s.total)} hint={`${s.uniquePeaks} unique peaks`} {...statProps("total")} />
          <Stat label="Repeat ascents" value={String(s.repeats)} hint={s.mostRepeated ? `${s.mostRepeated.name} ×${s.mostRepeated.times}` : undefined} {...statProps("repeats")} />
          <Stat label="UN country high points" value={String(s.highPoints)} hint={`${s.countries} countries`} {...statProps("highPoints")} />
          <Stat label="Famous peaks" value={String(s.famous)} hint={s.other ? `${s.other} other summits` : undefined} {...statProps("famous")} />
          <Stat label="Summit metres" value={m(s.totalMetres)} hint={`${s.everests.toFixed(1)}× Everest stacked`} {...statProps("metres")} />
          <Stat label="Average height" value={m(s.averageMetres)} hint={`median ${m(s.medianMetres)}`} {...statProps("average")} />
          <Stat label="Ascents / year" value={s.perYear.toFixed(1)} hint={`${s.activeYears} active years`} {...statProps("perYear")} />
          <Stat label="Total XP" value={formatXp(s.totalXp)} hint={`Level ${s.level} · ${s.levelTitle}`} {...statProps("xp")} />
        </div>
        {open && details[open] && <StatDetails title={STAT_LABELS[open] ?? open} items={details[open] ?? []} />}
      </div>

      <Section title="Altitude bands">
        <div className="space-y-2">
          {s.bands.map((b) => (
            <Bar key={b.label} label={b.label} count={b.count} max={maxBand} />
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          {s.highest && (
            <div className="rounded-md border border-border p-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Highest</div>
              <div className="mt-1">
                {s.highest.peak_name} · {m(parseElevation(s.highest.elevation))}
                <span className="text-muted-foreground"> · {formatAscentDate(s.highest.ascent_date)}</span>
              </div>
            </div>
          )}
          {s.hardest && (
            <div className="rounded-md border border-border p-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Hardest rated</div>
              <div className="mt-1">
                {s.hardest.ascent.peak_name}
                <span className="text-muted-foreground"> · {difficultyLabels[s.hardest.difficulty]}</span>
              </div>
            </div>
          )}
        </div>
      </Section>

      <Section title="Seasons">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SEASONS.map((season) => (
            <Stat
              key={season}
              label={`${season} climbs`}
              value={String(s.seasons[season])}
              hint={`${Math.round((s.seasons[season] / s.total) * 100)}% of all`}
              details={seasonAscents[season]}
              open={open === `season:${season}`}
              onToggle={() => setOpen(open === `season:${season}` ? null : `season:${season}`)}
            />
          ))}
        </div>
        {SEASONS.filter((season) => open === `season:${season}`).map((season) => (
          <StatDetails key={season} title={`${season} climbs`} items={seasonAscents[season] ?? []} />
        ))}
        <div className="space-y-2">
          {s.months.map((count, i) => (
            <Bar key={MONTHS[i]} label={MONTHS[i] ?? ""} count={count} max={maxMonth} />
          ))}
        </div>
        {s.busiestMonth && (
          <p className="text-xs text-muted-foreground">
            Busiest month: {MONTHS[s.busiestMonth.month]} with {s.busiestMonth.count} ascents.
          </p>
        )}
      </Section>

      <Section title="By year">
        <div className="space-y-2">
          {s.years.map((y) => (
            <Bar key={y.year} label={y.year} count={y.count} max={maxYear} note={`· ${m(y.metres)}`} />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {s.bestYear && <Stat label="Best year" value={s.bestYear.year} hint={`${s.bestYear.count} ascents`} />}
          <Stat label="Year streak" value={`${s.longestYearStreak}`} hint="consecutive years climbing" />
          <Stat label="Summit days" value={String(s.activeDays)} hint={`${s.multiPeakDays} multi-peak days`} />
          {s.bestDay && <Stat label="Biggest day" value={`${s.bestDay.count} peaks`} hint={formatAscentDate(s.bestDay.date)} />}
        </div>
      </Section>

      <Section title="Difficulty mix">
        <div className="space-y-2">
          {difficultyOrder.map((d) => (
            <Bar key={d} label={difficultyLabels[d]} count={s.difficulty[d]} max={maxDiff} />
          ))}
        </div>
      </Section>

      <Section title="Log quality & timeline">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="With photo" value={`${Math.round((s.withPhoto / s.total) * 100)}%`} hint={`${s.withPhoto} ascents`} />
          <Stat label="With trip report" value={`${Math.round((s.withReport / s.total) * 100)}%`} hint={`${s.withReport} ascents`} />
          <Stat label="With route" value={`${Math.round((s.withRoute / s.total) * 100)}%`} hint={`${s.withRoute} ascents`} />
          {s.topCountry && <Stat label="Top country" value={s.topCountry.name} hint={`${s.topCountry.count} ascents`} />}
        </div>
        <p className="text-sm text-muted-foreground">
          {s.firstAscent && <>First logged ascent: {s.firstAscent.peak_name} on {formatAscentDate(s.firstAscent.ascent_date)}. </>}
          {s.latestAscent && (
            <>
              Latest: {s.latestAscent.peak_name} on {formatAscentDate(s.latestAscent.ascent_date)}
              {typeof s.daysSinceLast === "number" ? ` — ${s.daysSinceLast} days ago.` : "."}
            </>
          )}
        </p>
      </Section>
    </div>
  );
};

export default AscentAnalytics;
