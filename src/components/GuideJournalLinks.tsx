import { CheckCircle2, Circle, MapPin, ArrowRight } from "lucide-react";
import { Link } from "@/lib/router-compat";
import type { CountryHighPoint } from "@/data/countries";

type Props = {
  rows: CountryHighPoint[];
  heading: string;
  className?: string;
};

/**
 * Automatic internal links from a guide to the matching sections of the journal
 * (summited / visited / yet-to-climb) plus direct peak page links.
 */
export default function GuideJournalLinks({ rows, heading, className = "" }: Props) {
  const summited = rows.filter((c) => (c.status === "climbed" || c.status === "legal_high_point") && c.unMember !== false);
  const visited = rows.filter((c) => c.status !== "not_visited");
  const todo = rows.filter((c) => c.status !== "climbed" && c.status !== "legal_high_point");

  const sections = [
    {
      key: "climbed",
      label: "Summited high points",
      icon: CheckCircle2,
      count: summited.length,
      color: "text-ice",
      desc: `Peaks from ${heading} already topped out.`,
    },
    {
      key: "visited",
      label: "Visited countries",
      icon: MapPin,
      count: visited.length,
      color: "text-accent",
      desc: "Countries reached — summit done, attempted or scouted.",
    },
    {
      key: "not_visited",
      label: "Yet to climb",
      icon: Circle,
      count: todo.length,
      color: "text-muted-foreground",
      desc: "Still open on the list — the road ahead.",
    },
  ];

  return (
    <section className={`mt-12 ${className}`}>
      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
        Follow this list in the journal
      </h2>
      <p className="text-sm text-muted-foreground mb-4 max-w-3xl">
        Jump straight into the live progress tracker, filtered to the status you care about.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.key}
              to={`/?filter=${s.key}#progress`}
              className="group bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${s.color}`} aria-hidden="true" />
                <span className="font-display font-bold text-foreground">{s.label}</span>
                <span className="ml-auto text-sm text-primary font-display">{s.count}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{s.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs text-primary">
                Open in journal
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </span>
            </Link>
          );
        })}
      </div>

      {summited.length > 0 && (
        <div className="mt-5">
          <h3 className="font-display text-sm tracking-wider text-primary mb-2">
            Journal entries from this list
          </h3>
          <div className="flex flex-wrap gap-2">
            {summited.map((c) => (
              <Link
                key={c.country}
                to={`/?filter=climbed&country=${encodeURIComponent(c.country)}#progress`}
                className="text-xs bg-secondary text-secondary-foreground hover:bg-muted rounded-sm px-3 py-1.5 transition-colors"
              >
                {c.highPoint} · {c.country}
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
