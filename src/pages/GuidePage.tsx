import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "@/lib/router-compat";
import { ArrowLeft, ArrowRight, Check, Search } from "lucide-react";
import Seo from "@/components/Seo";
import YouTubeCta from "@/components/YouTubeCta";
import GuideDetailBlocks from "@/components/GuideDetailBlocks";
import GuideJournalLinks from "@/components/GuideJournalLinks";


import Navbar from "@/components/Navbar";
import { getGuide, guides, elevationOf } from "@/data/guides";
import { countryDifficulty, difficultyConfig } from "@/data/difficulty";
import { peakDetails } from "@/data/peak-details";
import { organizationSchema } from "@/lib/structured-data";
import { slugify } from "@/lib/slug";
import { useLinkedProgress } from "@/hooks/useLinkedProgress";

const SITE = "https://onsightmartin.com";

export default function GuidePage() {
  const { guideSlug } = useParams<{ guideSlug: string }>();
  const guide = useMemo(() => (guideSlug ? getGuide(guideSlug) : undefined), [guideSlug]);
  const [query, setQuery] = useState("");
  // Keeps guide progress in sync with Martin's Ticklelist profile (same person).
  useLinkedProgress();

  if (!guide) return <Navigate to="/guides" replace />;

  const rows = guide.select();
  // Mainland-only ticks (e.g. Møllehøj for Denmark) are NOT the country high
  // point — Gunnbjørn Fjeld is still unclimbed — so they don't count here.
  const climbed = rows.filter((c) => (c.status === "climbed" || c.status === "legal_high_point") && c.unMember !== false).length;
  const q = query.trim().toLowerCase();
  const visible = q
    ? rows.filter((c) =>
        `${c.country} ${c.highPoint} ${peakDetails[c.country]?.peak ?? ""} ${c.continent}`
          .toLowerCase()
          .includes(q),
      )
    : rows;
  const path = `/guides/${guide.slug}`;
  const title = `${guide.seoTitle} | Onsight Martin`;
  const others = guides.filter((g) => g.slug !== guide.slug);

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title={title.length > 60 ? `${guide.seoTitle}` : title}
        description={guide.description}
        path={path}
        type="article"
        breadcrumbLeaf={guide.heading}
        structuredDataOnly

        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: guide.heading,
            description: guide.description,
            author: { "@type": "Person", name: "Martin Gårdling", url: `${SITE}/team` },
            publisher: organizationSchema,
            mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}${path}` },
          },
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: guide.heading,
            numberOfItems: rows.length,
            itemListElement: rows.slice(0, 100).map((c, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: `${c.highPoint} — ${c.country}`,
              url: `${SITE}/peak/${slugify(c.country)}`,
            })),
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: guide.faqs.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: { "@type": "Answer", text: f.answer },
            })),
          },
        ]}
      />
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Link
            to="/guides"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> All guides
          </Link>

          <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mt-6">
            {guide.heading}
          </h1>
          <p className="text-muted-foreground mt-4 max-w-3xl leading-relaxed">{guide.intro}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-display font-bold">{rows.length}</span> peaks ·{" "}
              <span className="text-primary font-display font-bold">{climbed}</span> climbed by Martin
            </p>
            <label className="relative ml-auto w-full sm:w-64">
              <span className="sr-only">Search this list</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search country or peak…"
                className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </label>
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <caption className="sr-only">{guide.heading}</caption>
              <thead className="bg-secondary text-muted-foreground">
                <tr>
                  <th scope="col" className="text-left font-display px-3 py-2 w-10">#</th>
                  <th scope="col" className="text-left font-display px-3 py-2">Country</th>
                  <th scope="col" className="text-left font-display px-3 py-2">Highest point</th>
                  <th scope="col" className="text-right font-display px-3 py-2">Elevation</th>
                  <th scope="col" className="text-left font-display px-3 py-2 hidden md:table-cell">Continent</th>
                  <th scope="col" className="text-left font-display px-3 py-2 hidden sm:table-cell">Difficulty</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c, i) => {
                  const diff = countryDifficulty[c.country]?.difficulty;
                  const detail = peakDetails[c.country];
                  const done = c.status === "climbed" || c.status === "legal_high_point";
                  const mainlandOnly = c.status === "mainland_climbed";
                  return (
                    <tr key={`${c.country}-${i}`} className="border-t border-border hover:bg-secondary/50">
                      <td className="px-3 py-2 text-muted-foreground">{rows.indexOf(c) + 1}</td>
                      <td className="px-3 py-2">
                        <Link
                          to={`/peak/${slugify(c.country)}`}
                          className="text-foreground hover:text-primary font-medium transition-colors inline-flex items-center gap-1.5"
                        >
                          {c.country}
                          {done && (
                            <Check
                              className="w-3.5 h-3.5 text-primary shrink-0"
                              aria-label="Climbed by Martin"
                            />
                          )}
                          {mainlandOnly && (
                            <span
                              className="text-[10px] uppercase tracking-wider text-mainland shrink-0"
                              title="Mainland high point summited — the country high point is still unclimbed"
                            >
                              mainland
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {detail?.peak ?? c.highPoint}
                      </td>
                      <td className="px-3 py-2 text-right text-foreground whitespace-nowrap">
                        {elevationOf(c).toLocaleString()} m
                      </td>
                      <td className="px-3 py-2 text-muted-foreground hidden md:table-cell whitespace-nowrap">
                        {c.continent}
                      </td>
                      <td className="px-3 py-2 hidden sm:table-cell">
                        {diff && (
                          <span
                            className={`text-xs font-display font-bold px-2 py-0.5 rounded-sm ${difficultyConfig[diff].color} ${difficultyConfig[diff].bgColor}`}
                          >
                            {difficultyConfig[diff].label}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {visible.length === 0 && (
                  <tr className="border-t border-border">
                    <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                      No peaks match “{query}”.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>


          <p className="text-sm text-muted-foreground mt-4 max-w-3xl">{guide.outro}</p>

          <GuideDetailBlocks rows={rows} />

          <GuideJournalLinks rows={rows} heading={guide.heading} />



          <section className="mt-12">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
              Frequently asked questions
            </h2>
            <div className="space-y-3 max-w-3xl">
              {guide.faqs.map((f) => (
                <div key={f.question} className="bg-secondary rounded-lg p-4">
                  <h3 className="font-display font-bold text-foreground mb-1">{f.question}</h3>
                  <p className="text-sm text-muted-foreground">{f.answer}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12">
            <h2 className="font-display text-2xl font-bold text-foreground mb-4">More lists</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {others.map((g) => (
                <Link
                  key={g.slug}
                  to={`/guides/${g.slug}`}
                  className="flex items-center justify-between gap-3 bg-card border border-border rounded-lg px-4 py-3 hover:border-primary/50 transition-colors"
                >
                  <span className="text-foreground">{g.heading}</span>
                  <ArrowRight className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>

          <YouTubeCta className="mt-12" />

        </div>
      </main>
    </div>
  );
}
