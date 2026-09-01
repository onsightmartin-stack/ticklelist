import { Link } from "@/lib/router-compat";
import { ArrowRight, Youtube } from "lucide-react";
import Navbar from "@/components/Navbar";
import Seo from "@/components/Seo";
import TicklelistCta from "@/components/TicklelistCta";
import { continentHubs } from "@/lib/highest-mountains";
import { countries } from "@/data/countries";
import { slugify } from "@/lib/slug";

/**
 * Landing page linked from YouTube video descriptions. Short, no clutter:
 * one promise, one action (start a tick list), plus a shortcut into the
 * peak pages for the country the video was filmed in.
 */
const StartPage = () => {
  const recent = countries
    .filter((c) => c.status === "climbed" && c.year)
    .sort((a, b) => (b.year ?? 0) * 12 + (b.month ?? 0) - ((a.year ?? 0) * 12 + (a.month ?? 0)))
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Start Your Own Tick List — Onsight Martin"
        description="Came from the videos? Track every summit you've climbed, build bucket lists and follow other climbers on Ticklelist — free."
        path="/start"
      />
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pt-24 pb-16">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Youtube className="h-4 w-4 text-primary" aria-hidden="true" /> Came from the videos?
        </p>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl tracking-wide text-foreground">
          Track your own mountains
        </h1>
        <p className="mt-4 text-muted-foreground">
          I'm climbing the highest mountain of every country on Earth and logging every step of it.
          You can do the same with your own peaks — the summits you've already climbed, the ones
          you're planning, and the countries you want to see.
        </p>

        <TicklelistCta className="mt-8" headline="Log your first summit in under a minute" source="youtube-start" />

        <h2 className="mt-12 font-display text-xl tracking-wide text-foreground">
          Peaks from the latest videos
        </h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {recent.map((c) => (
            <Link
              key={c.country}
              to={`/peak/${slugify(c.country)}`}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card/60 px-4 py-3 text-sm text-foreground hover:border-primary/60"
            >
              <span className="truncate">
                {c.highPoint} <span className="text-muted-foreground">· {c.country}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Link>
          ))}
        </div>

        <h2 className="mt-12 font-display text-xl tracking-wide text-foreground">
          Or browse every country highpoint
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/highest-mountains"
            className="rounded-full border border-primary/60 px-4 py-1.5 text-sm text-primary hover:bg-primary/10"
          >
            All 195 highpoints
          </Link>
          {continentHubs.map((c) => (
            <Link
              key={c.slug}
              to={`/highest-mountains/${c.slug}`}
              className="rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default StartPage;
