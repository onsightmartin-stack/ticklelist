import { Link } from "@/lib/router-compat";
import { ArrowRight, Mountain } from "lucide-react";
import Navbar from "@/components/Navbar";
import Seo from "@/components/Seo";
import TicklelistCta from "@/components/TicklelistCta";
import { useAbVariant } from "@/hooks/useAbVariant";
import {
  continentHubs,
  feet,
  hubRows,
  metres,
  type ContinentHub,
} from "@/lib/highest-mountains";

interface Props {
  /** Undefined on the global hub, set on a continent page. */
  hub?: ContinentHub;
}

const HighestMountainsPage = ({ hub }: Props) => {
  const rows = hubRows(hub?.name);
  const ctaVariant = useAbVariant("ticklelist_cta_copy");
  const path = hub ? `/highest-mountains/${hub.slug}` : "/highest-mountains";
  const title = hub
    ? `Highest Mountain in Every ${hub.adjective} Country (${rows.length})`
    : "Highest Mountain in Every Country on Earth — Full List";
  const description = hub
    ? `Every ${hub.adjective} country's highest mountain, ranked by elevation: ${rows[0]?.peak} down to ${rows[rows.length - 1]?.peak}. Heights in metres and feet, with route notes.`
    : "The highest mountain of all 195 countries, ranked by elevation, with heights in metres and feet plus route notes, difficulty and summit videos for each.";

  const climbed = rows.filter((r) => r.climbed).length;

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title={title.length > 60 ? title.slice(0, 60) : title}
        description={description}
        path={path}
        type="article"
        breadcrumbLeaf={hub ? `Highest mountains in ${hub.name}` : "Highest mountain in every country"}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: title,
            description,
            numberOfItems: rows.length,
            itemListElement: rows.map((r, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: `${r.peak} — ${r.country}`,
              url: `https://onsightmartin.com${r.path}`,
            })),
          },
        ]}
      />
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pt-24 pb-16">
        <nav className="text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            Home
          </Link>
          {hub && (
            <>
              {" / "}
              <Link to="/highest-mountains" className="hover:text-foreground">
                Highest mountains
              </Link>
            </>
          )}
        </nav>

        <h1 className="mt-4 font-display text-3xl sm:text-4xl tracking-wide text-foreground">
          {hub
            ? `Highest mountain in every ${hub.adjective} country`
            : "Highest mountain in every country on Earth"}
        </h1>
        <p className="mt-4 max-w-3xl text-muted-foreground">
          {hub
            ? hub.blurb
            : "There are 195 country highpoints on this list — 193 UN member states plus Taiwan and Antarctica. They range from Everest at 8,849 m to the Maldives' 2.4 m sand ridge. Martin has summited " +
              `${climbed} of them so far; every row links to a full page with route, season, difficulty and, where it exists, a summit video.`}
        </p>

        {hub && (
          <p className="mt-3 max-w-3xl text-muted-foreground">
            {rows.length} {hub.adjective} country highpoints are listed below, tallest first.{" "}
            {climbed > 0 && `${climbed} of them have been summited on this project.`}
          </p>
        )}

        {ctaVariant === "B" && (
          <TicklelistCta
            variant={ctaVariant}
            className="mt-8"
            source={hub ? `hub-${hub.slug}` : "hub-all"}
          />
        )}

        <div className="mt-8 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[36rem] text-sm">
            <caption className="sr-only">{title}</caption>
            <thead className="bg-card/70 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">
                  #
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Country
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Highest mountain
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Elevation
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Feet
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.country}-${r.peak}`} className="border-t border-border/60">
                  <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2">
                    <Link to={r.path} className="text-foreground hover:text-primary">
                      {r.country}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    <Link to={r.path} className="hover:text-primary">
                      {r.peak}
                    </Link>
                    {r.climbed && (
                      <span className="ml-2 text-[10px] uppercase tracking-wider text-primary">
                        summited
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right text-foreground">{metres(r.elevation)}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{feet(r.elevation)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-12 font-display text-xl tracking-wide text-foreground">
          Browse by continent
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {continentHubs
            .filter((c) => c.slug !== hub?.slug)
            .map((c) => (
              <Link
                key={c.slug}
                to={`/highest-mountains/${c.slug}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card/60 px-4 py-3 text-sm text-foreground hover:border-primary/60"
              >
                <span className="flex items-center gap-2">
                  <Mountain className="h-4 w-4 text-primary" aria-hidden="true" />
                  Highest mountains in {c.name}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </Link>
            ))}
          {hub && (
            <Link
              to="/highest-mountains"
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card/60 px-4 py-3 text-sm text-foreground hover:border-primary/60"
            >
              <span>All 195 country highpoints</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Link>
          )}
        </div>

        {ctaVariant === "A" && (
          <TicklelistCta
            variant={ctaVariant}
            className="mt-12"
            source={hub ? `hub-${hub.slug}` : "hub-all"}
          />
        )}
      </main>
    </div>
  );
};

export default HighestMountainsPage;
