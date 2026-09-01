import { Link } from "@/lib/router-compat";
import { Users, CalendarDays, Route as RouteIcon } from "lucide-react";
import type { PeakAscentEntry } from "@/lib/peak-detail.functions";

const formatDate = (date: string | null, precision: string | null) => {
  if (!date) return "Date unknown";
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return date;
  if (precision === "year") return String(d.getUTCFullYear());
  if (precision === "month")
    return d.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
};

interface Props {
  peakName: string;
  ascents: PeakAscentEntry[];
}

/** Who in the community has climbed this peak, newest first. */
const PeakAscentRegistry = ({ peakName, ascents }: Props) => {
  const dated = ascents.filter((a) => a.ascentDate);
  const first = dated.length ? dated[dated.length - 1] : null;
  const latest = dated.length ? dated[0] : null;
  const climbers = new Set(ascents.map((a) => a.userId)).size;

  return (
    <section className="mt-10">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        <Users className="h-4 w-4" /> Community ascents
      </h2>

      {ascents.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/40 p-6 text-center">
          <p className="text-muted-foreground">
            No one has logged {peakName} yet — be the first to tick it.
          </p>
          <Link
            to="/community/ascents"
            className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
          >
            Log your ascent
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-border bg-card/60 p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Ascents</div>
              <div className="mt-1 text-lg font-semibold text-foreground">{ascents.length}</div>
            </div>
            <div className="rounded-lg border border-border bg-card/60 p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Climbers</div>
              <div className="mt-1 text-lg font-semibold text-foreground">{climbers}</div>
            </div>
            <div className="rounded-lg border border-border bg-card/60 p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                First logged
              </div>
              <div className="mt-1 text-sm font-semibold text-foreground">
                {first ? formatDate(first.ascentDate, first.datePrecision) : "—"}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card/60 p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Latest</div>
              <div className="mt-1 text-sm font-semibold text-foreground">
                {latest ? formatDate(latest.ascentDate, latest.datePrecision) : "—"}
              </div>
            </div>
          </div>

          <ul className="mt-4 space-y-3">
            {ascents.map((a) => (
              <li
                key={a.id}
                className="flex gap-3 rounded-lg border border-border bg-card/60 p-3"
              >
                {a.avatarUrl ? (
                  <img
                    src={a.avatarUrl}
                    alt={a.displayName ?? "Climber"}
                    loading="lazy"
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-muted-foreground">
                    {(a.displayName ?? "?").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <Link
                      to={`/community/members/${a.userId}`}
                      className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {a.displayName ?? "Ticklelist member"}
                    </Link>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      {formatDate(a.ascentDate, a.datePrecision)}
                    </span>
                  </div>
                  {a.route && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <RouteIcon className="h-3.5 w-3.5" /> {a.route}
                    </p>
                  )}
                  {a.tripReport && (
                    <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                      {a.tripReport}
                    </p>
                  )}
                </div>
                {a.photoUrl && (
                  <img
                    src={a.photoUrl}
                    alt={`${peakName} summit photo`}
                    loading="lazy"
                    className="hidden h-16 w-24 rounded object-cover sm:block"
                  />
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
};

export default PeakAscentRegistry;
