import { useMemo } from "react";
import { Link } from "@/lib/router-compat";
import { Mountain, CalendarDays, Route, BarChart3, TrendingUp, Layers } from "lucide-react";
import type { CountryHighPoint } from "@/data/countries";
import { slugify } from "@/lib/slug";
import { quickStats, difficultyBreakdown, seasonWindows, routeOptions, fmt } from "@/lib/guide-detail";

export default function GuideDetailBlocks({ rows, className = "" }: { rows: CountryHighPoint[]; className?: string }) {
  const stats = useMemo(() => quickStats(rows), [rows]);
  const diffs = useMemo(() => difficultyBreakdown(rows), [rows]);
  const seasons = useMemo(() => seasonWindows(rows), [rows]);
  const routes = useMemo(() => routeOptions(rows), [rows]);

  if (rows.length === 0) return null;

  return (
    <div className={className}>
      {/* Quick stats */}
      <section className="mt-12">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" aria-hidden="true" /> Quick stats
        </h2>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Stat label="Peaks on this list" value={fmt(stats.count)} sub={`${stats.climbed} climbed by Martin`} />
          <Stat
            label="Highest"
            value={stats.highest ? `${fmt(stats.highest.elevation)} m` : "—"}
            sub={stats.highest ? `${stats.highest.peak}, ${stats.highest.country}` : undefined}
            to={stats.highest ? `/peak/${slugify(stats.highest.country)}` : undefined}
          />
          <Stat
            label="Lowest"
            value={stats.lowest ? `${fmt(stats.lowest.elevation)} m` : "—"}
            sub={stats.lowest ? `${stats.lowest.peak}, ${stats.lowest.country}` : undefined}
            to={stats.lowest ? `/peak/${slugify(stats.lowest.country)}` : undefined}
          />
          <Stat label="Median elevation" value={`${fmt(stats.medianElevation)} m`} sub={`${fmt(stats.totalVertical)} m stacked total`} />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" aria-hidden="true" /> Continents covered
            </p>
            <p className="text-sm text-foreground mt-2">{stats.continents.join(" · ")}</p>
          </div>
          {stats.ranges.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Mountain className="w-3.5 h-3.5" aria-hidden="true" /> Main ranges
              </p>
              <p className="text-sm text-foreground mt-2">
                {stats.ranges.map((r) => `${r.range} (${r.count})`).join(" · ")}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Difficulty */}
      {diffs.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" aria-hidden="true" /> Difficulty spread
          </h2>
          <div className="space-y-3 max-w-3xl">
            {diffs.map((d) => (
              <div key={d.difficulty} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className={`px-2 py-0.5 rounded-sm font-display text-xs ${d.bgColor} ${d.color}`}>{d.label}</span>
                  <span className="text-foreground font-display">{d.count} peaks</span>
                  <span className="ml-auto text-muted-foreground text-xs">{d.share}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full mt-3 overflow-hidden">
                  <div className={`h-full ${d.bgColor}`} style={{ width: `${Math.max(d.share, 2)}%` }} />
                </div>
                {d.examples.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">e.g. {d.examples.join(", ")}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Route options */}
      {routes.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Route className="w-5 h-5 text-primary" aria-hidden="true" /> Route options
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {routes.map((r) => (
              <div key={r.difficulty} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-sm font-display text-xs ${r.bgColor} ${r.color}`}>{r.label}</span>
                  <h3 className="font-display font-bold text-foreground">{r.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{r.style}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  <span className="text-foreground">Gear:</span> {r.gear}
                </p>
                {r.peaks.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {r.peaks.map((p) => (
                      <Link
                        key={p.country}
                        to={`/peak/${slugify(p.country)}`}
                        className="text-xs bg-secondary text-secondary-foreground hover:bg-muted rounded-sm px-2 py-1 transition-colors"
                      >
                        {p.peak}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Season */}
      {seasons.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" aria-hidden="true" /> Best season
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {seasons.map((s) => (
              <div key={s.band} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-baseline gap-2">
                  <h3 className="font-display font-bold text-foreground capitalize">{s.band} peaks</h3>
                  <span className="text-xs text-muted-foreground">{s.count} on this list</span>
                </div>
                <p className="text-primary font-display text-sm mt-1">{s.window}</p>
                <p className="text-sm text-muted-foreground mt-2">{s.note}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, sub, to }: { label: string; value: string; sub?: string | undefined; to?: string | undefined }) {
  const body = (
    <>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-display text-2xl font-bold text-foreground mt-1">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </>
  );
  const cls = "bg-card border border-border rounded-lg p-4 block";
  return to ? (
    <Link to={to} className={`${cls} hover:border-primary/50 transition-colors`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
