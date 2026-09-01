import { useMemo, useState } from "react";
import { Award } from "lucide-react";
import { computeBadges, computeStats, rankFor, type Badge } from "@/lib/badges";
import { honourBadges, rarityClass, bonusTitleById, type HonourBadge } from "@/lib/bonus-titles";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useBonusTitles } from "@/hooks/useBonusTitles";
import BonusTitleClaim from "@/components/community/BonusTitleClaim";
import { computeXp, formatXp, LIST_COMPLETION_BONUS } from "@/lib/xp";
import { computeExplorerXp } from "@/lib/explorer-xp";
import type { Visit } from "@/data/places";
import type { Ascent } from "@/lib/peak-catalog";
import { cn } from "@/lib/utils";

interface Props {
  ascents: Ascent[];
  visits?: Visit[];
  name?: string;
  /** Member the panel belongs to — enables honour badges. */
  userId?: string;
  /** Show the claim controls (own profile). */
  editable?: boolean;
  className?: string;
}

/** Rank ladder + badge grid derived from a climber's logged ascents. */
const BadgesPanel = ({ ascents, visits = [], name = "This climber", userId, editable = false, className }: Props) => {
  const { rows: honourRows, reload: reloadHonours } = useBonusTitles(userId);
  const [selected, setSelected] = useState<{ b: Badge | HonourBadge; honour: HonourBadge | null } | null>(null);
  const honours = useMemo(() => honourBadges(honourRows), [honourRows]);
  const stats = useMemo(() => computeStats(ascents), [ascents]);
  const { current, next } = rankFor(stats.total);
  const xp = useMemo(() => computeXp(ascents), [ascents]);
  const explorer = useMemo(() => computeExplorerXp(visits), [visits]);
  const badges = useMemo(() => computeBadges(stats, xp.total + explorer.total), [stats, xp.total, explorer.total]);

  const span = next ? next.min - current.min : 1;
  const pct = next ? Math.min(100, Math.round(((stats.total - current.min) / span) * 100)) : 100;
  const earned = badges.filter((b) => b.earned);
  const locked = badges.filter((b) => !b.earned);

  return (
    <section className={cn("rounded-lg border border-border bg-card p-5", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl tracking-wider flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" /> Rank & badges
        </h2>
        <span className="text-xs text-muted-foreground">
          {earned.length + honours.length}/{badges.length + honours.length} badges earned
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-display tracking-wider text-lg text-primary">{current.name}</p>
          <p className="text-xs text-muted-foreground">
            {next ? `${next.min - stats.total} more ascent${next.min - stats.total === 1 ? "" : ""} to ${next.name}` : "Top rank reached"}
          </p>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{current.blurb}</p>
        <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 items-start">
      <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-display tracking-wider text-lg">
            <span className="text-primary">Level {xp.level.level}</span> · {xp.level.title}
          </p>
          <p className="font-display tracking-wider text-primary">{formatXp(xp.total)} XP</p>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${xp.pct}%` }} />
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          {xp.next
            ? `${formatXp(xp.next.min - xp.total)} XP to Level ${xp.next.level} · ${xp.next.title}`
            : "Max level — nothing left to climb but the same peaks again."}
          {xp.best && ` · Best summit: ${xp.best.name} (+${formatXp(xp.best.xp)})`}
        </p>
        {xp.listBonus > 0 && (
          <p className="text-[11px] text-primary mt-1">
            +{formatXp(xp.listBonus)} XP list bonus — completed: {xp.completedLists.join(", ")}
          </p>
        )}
        <p className="text-[11px] text-muted-foreground mt-1">
          Climber XP scales with altitude and difficulty — repeats of the same peak count for 25%, and every
          completed tick list adds {formatXp(LIST_COMPLETION_BONUS)} XP.
        </p>

      </div>

      <div className="rounded-md border border-accent/30 bg-accent/5 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-display tracking-wider text-lg">
            <span className="text-accent">Explorer {explorer.level.level}</span> · {explorer.level.title}
          </p>
          <p className="font-display tracking-wider text-accent">{formatXp(explorer.total)} XP</p>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
          <div className="h-full bg-accent transition-all" style={{ width: `${explorer.pct}%` }} />
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          {explorer.next
            ? `${formatXp(explorer.next.min - explorer.total)} XP to Explorer ${explorer.next.level} · ${explorer.next.title}`
            : "Max explorer level — the map has run out of blank bits."}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          {explorer.countries} countries · {explorer.places} other places · {explorer.continents} continents
          {explorer.continentBonus > 0 && ` (+${formatXp(explorer.continentBonus)} XP continent bonus)`}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          A separate track from climbing — poles and wonders pay the most.
        </p>
      </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        {[
          { label: "Ascents", value: stats.total },
          { label: "High points", value: stats.highpoints },
          { label: "Countries", value: stats.countries },
          { label: "XP", value: formatXp(xp.total) },
        ].map((s) => (
          <div key={s.label} className="rounded-md border border-border p-3">
            <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{s.label}</dt>
            <dd className="font-display text-xl tracking-wider mt-1">{s.value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-5 text-[11px] text-muted-foreground">Tap a badge to see what it means.</p>
      <ul className="mt-2 grid sm:grid-cols-2 gap-2">
        {[
          ...honours.map((h) => ({ b: h as HonourBadge, honour: h as HonourBadge | null })),
          ...[...earned, ...locked].map((x) => ({ b: x, honour: null as HonourBadge | null })),
        ].map(({ b, honour }) => {
          return (
          <li key={b.id}>
            <button
              type="button"
              onClick={() => setSelected({ b, honour })}
              aria-label={`About the ${b.name} badge`}
              className={cn(
                "w-full text-left rounded-md border p-3 flex items-start gap-3 transition-colors hover:border-primary/60",
                honour
                  ? rarityClass[honour.rarity]
                  : b.earned
                    ? "border-primary/40 bg-primary/5"
                    : "border-border opacity-60",
              )}
            >
              <span className="text-xl leading-none" aria-hidden>{b.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-display tracking-wider">
                  {b.name}
                  {honour?.verified && <span className="ml-1 text-primary text-xs">✓</span>}
                </p>
                <p className="text-xs text-muted-foreground">{b.description}</p>
                {!b.earned && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {b.progress}/{b.target}
                  </p>
                )}
              </div>
            </button>
          </li>
          );
        })}
      </ul>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display tracking-wider flex items-center gap-2">
                  <span aria-hidden>{selected.b.icon}</span> {selected.b.name}
                </DialogTitle>
                <DialogDescription>
                  {selected.honour
                    ? `Honour badge · ${selected.honour.rarity} · ${selected.honour.verified ? "verified by an admin" : "self-claimed"}`
                    : selected.b.earned
                      ? "Earned"
                      : "Not earned yet"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">How it's earned</p>
                  <p className="text-muted-foreground mt-1">
                    {selected.honour
                      ? bonusTitleById(selected.honour.id.replace("honour:", ""))?.criteria
                      : selected.b.description}
                  </p>
                </div>

                {!selected.honour && "detail" in selected.b && selected.b.detail && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">What counts</p>
                    <p className="text-muted-foreground mt-1">{selected.b.detail}</p>
                  </div>
                )}

                {!selected.honour && "counted" in selected.b && (selected.b.counted?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {selected.b.countedLabel ?? "Counting so far"} ({selected.b.counted!.length})
                    </p>
                    <ul className="mt-1 max-h-48 overflow-y-auto space-y-0.5 text-xs text-muted-foreground">
                      {selected.b.counted!.map((c, i) => (
                        <li key={`${c}-${i}`} className="flex gap-2">
                          <span className="text-primary shrink-0">{i + 1}.</span>
                          <span className="truncate">{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selected.honour ? (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">The story</p>
                    <p className="text-muted-foreground mt-1 whitespace-pre-line">
                      {selected.b.description}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Progress</p>
                    <p className="text-muted-foreground mt-1">
                      {selected.b.progress}/{selected.b.target}
                      {!selected.b.earned && ` · ${Math.max(0, selected.b.target - selected.b.progress)} to go`}
                    </p>
                    <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${Math.min(100, Math.round((selected.b.progress / Math.max(1, selected.b.target)) * 100))}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {editable && userId && (
        <BonusTitleClaim userId={userId} rows={honourRows} onChanged={reloadHonours} />
      )}

      {stats.total === 0 && (
        <p className="mt-4 text-xs text-muted-foreground">{name} hasn't logged any ascents yet.</p>
      )}
    </section>
  );
};

export default BadgesPanel;
