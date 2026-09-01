import { useEffect, useMemo, useState } from "react";
import { fetchWinnerPhoto } from "@/lib/photo-contest";
import { useParams, Link, Navigate } from "@/lib/router-compat";
import Seo from "@/components/Seo";
import { organizationSchema } from "@/lib/structured-data";
import { Mountain, ArrowUpRight, Navigation, Calendar, ArrowLeft, Youtube, MapPin, CheckCircle2, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import PeakImage from "@/components/PeakImage";
import UnMemberBadge from "@/components/UnMemberBadge";
import YouTubeCta from "@/components/YouTubeCta";
import MatchMeCta from "@/components/MatchMeCta";
import TicklelistCta from "@/components/TicklelistCta";
import { useAbVariant } from "@/hooks/useAbVariant";
import { continentHubs } from "@/lib/highest-mountains";

import { peakDetails } from "@/data/peak-details";
import { peakSeo } from "@/data/peak-seo";
import { personalNotes } from "@/data/personal-notes";
import { countries } from "@/data/countries";
import { countryDifficulty, difficultyConfig } from "@/data/difficulty";
import { getPeakGuideFacts } from "@/lib/peak-guide";
import { guides, elevationOf } from "@/data/guides";
import { slugify, findCountryBySlug } from "@/lib/slug";


function formatMonthYear(year?: number, month?: number): string {
  if (!year) return "Not yet climbed";
  if (!month) return String(year);
  const date = new Date(year, month - 1);
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function getYouTubeEmbedUrl(url: string | undefined): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|v=|embed\/)([^?&]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function generateFaqs(
  peak: string,
  country: string,
  elevation: number,
  range: string,
  facts: { duration: string; guideNeeded: string; season: string; gear: string; permits?: string },
  year?: number,
) {
  const countryName = country;
  return [
    {
      question: `What is the highest mountain in ${countryName}?`,
      answer: `The highest mountain in ${countryName} is ${peak}, at ${elevation.toLocaleString()} meters above sea level.`,
    },
    {
      question: `How long does it take to climb ${peak}?`,
      answer: `Allow ${facts.duration}. Times vary with fitness, conditions and which trailhead you start from.`,
    },
    {
      question: `Can you climb ${peak} without a guide?`,
      answer: facts.guideNeeded,
    },
    {
      question: `When is the best time to climb ${peak}?`,
      answer: `The usual season is ${facts.season}. Outside that window expect snow, storms or closed access.`,
    },
    {
      question: `What gear do you need for ${peak}?`,
      answer: facts.gear,
    },
    ...(facts.permits
      ? [{ question: `Do you need a permit to climb ${peak}?`, answer: facts.permits }]
      : []),
    {
      question: `How high is ${peak}?`,
      answer: `${peak} stands at ${elevation.toLocaleString()} meters (${Math.round(elevation * 3.28084).toLocaleString()} feet).`,
    },
    {
      question: `Where is ${peak} located?`,
      answer: `${peak} is located in ${countryName}, within the ${range}.`,
    },
    {
      question: `Has Martin climbed ${peak}?`,
      answer: year
        ? `Yes — Martin summited ${peak} in ${formatMonthYear(year)} as part of his country highpointing project.`
        : `Not yet — ${peak} is still on Martin's list of remaining country highpoints.`,
    },
  ];
}


export default function PeakPage() {
  const { countrySlug } = useParams<{ countrySlug: string }>();
  const ctaVariant = useAbVariant("ticklelist_cta_copy");
  const country = useMemo(() => {
    if (!countrySlug) return null;
    return findCountryBySlug(countrySlug, countries);
  }, [countrySlug]);

  const detail = country ? peakDetails[country] : undefined;
  const entry = country ? countries.find((c) => c.country === country) : undefined;

  // Community photo contest: once a peak's 30-day round closes, the winning
  // member photo takes over as the hero image.
  const [winnerPhoto, setWinnerPhoto] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (!countrySlug) return;
    void fetchWinnerPhoto(countrySlug).then((w) => {
      if (active) setWinnerPhoto(w?.photo_url ?? null);
    });
    return () => {
      active = false;
    };
  }, [countrySlug]);

  if (!country || !detail || !entry) {
    return <Navigate to="/" replace />;
  }

  const note = personalNotes[country];
  const difficulty = countryDifficulty[country];
  const embedUrl = getYouTubeEmbedUrl(detail.youtubeUrl);
  const facts = getPeakGuideFacts(
    difficulty?.difficulty,
    detail.elevation,
    detail.coordinates.lat,
    country,
  );
  const seoOverride = peakSeo[country];
  const faqs = [
    ...generateFaqs(detail.peak, country, detail.elevation, detail.range, facts, entry.year),
    ...(seoOverride?.faqs ?? []),
  ];
  const relatedPeaks = countries
    .filter((c) => c.country !== country && c.continent === entry.continent && peakDetails[c.country])
    .sort(
      (a, b) =>
        Math.abs(elevationOf(a) - detail.elevation) - Math.abs(elevationOf(b) - detail.elevation),
    )
    .slice(0, 6);

  // Lead with the phrase people actually search ("highest mountain in X") —
  // Search Console shows those queries ranking 11-15 for these pages.
  const rawTitle = `Highest Mountain in ${country}: ${detail.peak} (${detail.elevation.toLocaleString()} m)`;
  const pageTitle =
    seoOverride?.title ??
    (rawTitle.length <= 60
      ? rawTitle
      : `Highest Mountain in ${country}: ${detail.peak}`.slice(0, 60));
  const rawDescription = note
    ? `The highest mountain in ${country} is ${detail.peak}, ${detail.elevation.toLocaleString()} m. ${note}`
    : `The highest mountain in ${country} is ${detail.peak}, ${detail.elevation.toLocaleString()} m. Route, best season, difficulty, photos and summit video.`;
  const pageDescription =
    seoOverride?.description ??
    (rawDescription.length > 155 ? `${rawDescription.slice(0, 152)}…` : rawDescription);

  const canonicalUrl = `https://onsightmartin.com/peak/${slugify(country)}`;

  const statusLabel =
    entry.status === "climbed"
      ? "Summited"
      : entry.status === "mainland_climbed"
      ? "Mainland HP"
      : entry.status === "legal_high_point"
      ? "Legal HP"
      : entry.status === "visited"
      ? "Visited"
      : "Not Yet Climbed";

  const statusColor =
    entry.status === "climbed"
      ? "text-primary"
      : entry.status === "mainland_climbed"
      ? "text-mainland"
      : entry.status === "legal_high_point"
      ? "text-legal"
      : entry.status === "visited"
      ? "text-accent"
      : "text-muted-foreground";

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title={pageTitle}
        description={pageDescription}
        path={`/peak/${slugify(country)}`}
        image={detail.photoUrl}
        type="article"
        breadcrumbLeaf={`${detail.peak} (${country})`}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: `${detail.peak}: Highest Mountain of ${country}`,
            description: pageDescription,
            image: detail.photoUrl,
            ...(entry.year
              ? { datePublished: new Date(entry.year, (entry.month ?? 1) - 1, 1).toISOString() }
              : {}),
            author: {
              "@type": "Person",
              name: "Martin Gårdling",
              url: "https://www.youtube.com/@onsightmartin",
            },
            publisher: organizationSchema,
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": canonicalUrl,
            },
            about: {
              "@type": "Mountain",
              name: detail.peak,
              elevation: `${detail.elevation} m`,
              address: {
                "@type": "PostalAddress",
                addressCountry: country,
              },
            },
          },
          ...(detail.youtubeUrl
            ? [
                {
                  "@context": "https://schema.org",
                  "@type": "VideoObject",
                  name: `${detail.peak} summit video — highest point of ${country}`,
                  description: `Martin Gårdling climbs ${detail.peak} (${detail.elevation.toLocaleString()} m), the highest mountain of ${country}.`,
                  thumbnailUrl: [detail.photoUrl],
                  uploadDate: entry.year
                    ? new Date(entry.year, (entry.month ?? 1) - 1, 1).toISOString()
                    : undefined,
                  contentUrl: detail.youtubeUrl,
                  embedUrl: embedUrl ?? undefined,
                  publisher: organizationSchema,
                },
              ]
            : []),
          {

            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              },
            })),
          },
        ]}
      />

      <Navbar />

      <section className="relative h-[50vh] md:h-[60vh] flex items-end overflow-hidden">
        <PeakImage
          src={winnerPhoto ?? detail.photoUrl}
          alt={`${detail.peak} (${detail.elevation.toLocaleString()} m), the highest mountain of ${country}, seen from the ${detail.range}`}
          className="absolute inset-0 w-full h-full object-cover object-top"
          width={1600}
          height={900}
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="relative container mx-auto px-4 pb-8 md:pb-12">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" /> Back to all highpoints
          </Link>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground leading-tight">
            {detail.peak}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-lg md:text-xl text-muted-foreground">
              Highest mountain of {country}
            </p>
            <UnMemberBadge unMember={entry.unMember} />
          </div>
        </div>
      </section>

      {ctaVariant === "B" && (
        <div className="container mx-auto px-4 mt-6">
          <TicklelistCta
            variant={ctaVariant}
            headline={`Climbed ${detail.peak}? Add it to your tick list`}
            source={`peak-${slugify(country)}`}
          />
        </div>
      )}

      <section className="container mx-auto px-4 py-10 md:py-14">
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <span className={`font-display font-bold tracking-wider text-sm ${statusColor} flex items-center gap-1.5`}>
            {entry.status === "climbed" && <CheckCircle2 className="w-4 h-4" />}
            {entry.status === "visited" && <MapPin className="w-4 h-4" />}
            {statusLabel}
            {entry.year ? ` · ${formatMonthYear(entry.year, entry.month)}` : ""}
          </span>
          {difficulty && (
            <span className={`text-xs font-display font-bold px-2 py-0.5 rounded-sm ${difficultyConfig[difficulty.difficulty].color} ${difficultyConfig[difficulty.difficulty].bgColor}`}>
              {difficultyConfig[difficulty.difficulty].label}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-10">
          <div className="bg-secondary rounded-lg p-4 text-center">
            <Mountain className="w-5 h-5 mx-auto mb-2 text-primary" />
            <p className="font-display text-lg font-bold text-foreground">{detail.elevation.toLocaleString()} m</p>
            <p className="text-xs text-muted-foreground">Elevation</p>
          </div>
          <div className="bg-secondary rounded-lg p-4 text-center">
            <ArrowUpRight className="w-5 h-5 mx-auto mb-2 text-ice" />
            <p className="font-display text-lg font-bold text-foreground">{detail.prominence.toLocaleString()} m</p>
            <p className="text-xs text-muted-foreground">Prominence</p>
          </div>
          <div className="bg-secondary rounded-lg p-4 text-center">
            <Navigation className="w-5 h-5 mx-auto mb-2 text-accent" />
            <p className="font-display text-sm font-bold text-foreground">
              {detail.coordinates.lat.toFixed(4)}°, {detail.coordinates.lng.toFixed(4)}°
            </p>
            <p className="text-xs text-muted-foreground">Coordinates</p>
          </div>
          <div className="bg-secondary rounded-lg p-4 text-center">
            <Calendar className="w-5 h-5 mx-auto mb-2 text-primary" />
            <p className="font-display text-sm font-bold text-foreground">{detail.firstAscent}</p>
            <p className="text-xs text-muted-foreground">First Ascent</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 md:gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">About {detail.peak}</h2>
              {seoOverride?.intro && (
                <p className="text-muted-foreground leading-relaxed mb-3">{seoOverride.intro}</p>
              )}
              <p className="text-muted-foreground leading-relaxed">{detail.description}</p>
              {seoOverride?.aliases && seoOverride.aliases.length > 0 && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Also known as: {seoOverride.aliases.join(", ")}.
                </p>
              )}
            </div>

            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                Climbing {detail.peak}: route, season and difficulty
              </h2>
              <dl className="grid sm:grid-cols-2 gap-3">
                <div className="bg-secondary rounded-lg p-4">
                  <dt className="text-xs font-display font-bold uppercase tracking-wider text-primary mb-1">How long it takes</dt>
                  <dd className="text-sm text-muted-foreground">{facts.duration}</dd>
                </div>
                <div className="bg-secondary rounded-lg p-4">
                  <dt className="text-xs font-display font-bold uppercase tracking-wider text-primary mb-1">Do you need a guide?</dt>
                  <dd className="text-sm text-muted-foreground">{facts.guideNeeded}</dd>
                </div>
                <div className="bg-secondary rounded-lg p-4">
                  <dt className="text-xs font-display font-bold uppercase tracking-wider text-primary mb-1">Best season</dt>
                  <dd className="text-sm text-muted-foreground">Usually {facts.season}.</dd>
                </div>
                <div className="bg-secondary rounded-lg p-4">
                  <dt className="text-xs font-display font-bold uppercase tracking-wider text-primary mb-1">Terrain &amp; gear</dt>
                  <dd className="text-sm text-muted-foreground">{facts.terrain} {facts.gear}</dd>
                </div>
                {facts.permits && (
                  <div className="bg-secondary rounded-lg p-4 sm:col-span-2">
                    <dt className="text-xs font-display font-bold uppercase tracking-wider text-primary mb-1">Permits &amp; fees</dt>
                    <dd className="text-sm text-muted-foreground">{facts.permits}</dd>
                  </div>
                )}
              </dl>
              {difficulty?.difficultyNote && (
                <p className="text-sm text-muted-foreground mt-3">Note: {difficulty.difficultyNote}</p>
              )}
            </div>

            {seoOverride?.sections?.map((section) => (
              <div key={section.heading}>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
                  {section.heading}
                </h2>
                {section.paragraphs?.map((p, i) => (
                  <p key={i} className="text-muted-foreground leading-relaxed mb-3">
                    {p}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="space-y-2 mt-2">
                    {section.bullets.map((b, i) => (
                      <li key={i} className="flex gap-2 text-sm text-muted-foreground leading-relaxed">
                        <span className="text-primary mt-0.5">▸</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {section.table && (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                      {section.table.caption && (
                        <caption className="text-xs text-muted-foreground text-left pb-2">
                          {section.table.caption}
                        </caption>
                      )}
                      <tbody>
                        {section.table.rows.map(([label, value]) => (
                          <tr key={label} className="border-b border-border last:border-0">
                            <th
                              scope="row"
                              className="text-left align-top font-display font-bold text-foreground bg-secondary px-3 py-2 whitespace-nowrap"
                            >
                              {label}
                            </th>
                            <td className="align-top text-muted-foreground px-3 py-2">{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}

            {note && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-5 space-y-2">
                <p className="text-xs font-display font-bold text-primary uppercase tracking-wider">📝 Martin's Personal Note</p>
                <p className="text-foreground leading-relaxed italic">{note}</p>
              </div>
            )}

            {embedUrl && (
              <div className="space-y-3">
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">Summit Video</h2>
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-secondary border border-border">
                  <iframe
                    src={embedUrl}
                    title={`${detail.peak} summit video`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
                <a
                  href={detail.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <Youtube className="w-4 h-4 text-red-500" /> Watch on YouTube →
                </a>
                <div>
                  <MatchMeCta country={country} peakName={detail.peak} variant="inline" />
                </div>
              </div>
            )}

            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">Frequently Asked Questions</h2>
              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="bg-secondary rounded-lg p-4">
                    <h3 className="font-display font-bold text-foreground mb-1">{faq.question}</h3>
                    <p className="text-sm text-muted-foreground">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            {relatedPeaks.length > 0 && (
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Nearby highpoints of similar height
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {relatedPeaks.map((c) => (
                    <Link
                      key={c.country}
                      to={`/peak/${slugify(c.country)}`}
                      className="flex items-center justify-between gap-3 bg-card border border-border rounded-lg px-4 py-3 hover:border-primary/50 transition-colors"
                    >
                      <span className="text-foreground">
                        {peakDetails[c.country]?.peak ?? c.highPoint}
                        <span className="text-muted-foreground"> · {c.country}</span>
                      </span>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {elevationOf(c).toLocaleString()} m
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                Highpointing lists to explore
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {guides.slice(0, 4).map((g) => (
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
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <Link
                to="/highest-mountains"
                className="flex items-center justify-between gap-3 bg-card border border-border rounded-lg px-4 py-3 hover:border-primary/50 transition-colors"
              >
                <span className="text-foreground">Highest mountain in every country</span>
                <ArrowRight className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              </Link>
              {continentHubs
                .filter((h) => h.name === entry.continent)
                .map((h) => (
                  <Link
                    key={h.slug}
                    to={`/highest-mountains/${h.slug}`}
                    className="flex items-center justify-between gap-3 bg-card border border-border rounded-lg px-4 py-3 hover:border-primary/50 transition-colors"
                  >
                    <span className="text-foreground">Highest mountains in {h.name}</span>
                    <ArrowRight className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                  </Link>
                ))}
            </div>

            {ctaVariant === "A" && (
              <TicklelistCta
                variant={ctaVariant}
                headline={`Climbed ${detail.peak}? Add it to your tick list`}
                source={`peak-${slugify(country)}`}
              />
            )}

          </div>

          <aside className="space-y-6">
            <MatchMeCta country={country} peakName={detail.peak} />

            <YouTubeCta context={`${detail.peak}, ${country}`} />

            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <h3 className="font-display text-lg font-bold text-foreground">Quick Facts</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Country</dt>
                  <dd className="text-foreground font-medium">{country}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Peak</dt>
                  <dd className="text-foreground font-medium">{detail.peak}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Range</dt>
                  <dd className="text-foreground font-medium">{detail.range}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Elevation</dt>
                  <dd className="text-foreground font-medium">{detail.elevation.toLocaleString()} m</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Prominence</dt>
                  <dd className="text-foreground font-medium">{detail.prominence.toLocaleString()} m</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">First ascent</dt>
                  <dd className="text-foreground font-medium">{detail.firstAscent}</dd>
                </div>
                {entry.year && (
                  <div>
                    <dt className="text-muted-foreground">Martin's ascent</dt>
                    <dd className="text-foreground font-medium">{formatMonthYear(entry.year, entry.month)}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="font-display text-lg font-bold text-foreground mb-3">Follow the Journey</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Martin is climbing the highest mountain of every country on Earth. Track progress and watch every summit.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-sm text-sm font-display tracking-wider hover:bg-primary/90 transition-colors"
              >
                View All Highpoints
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <footer className="bg-background border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} Onsight Martin — Martin Gårdling</p>
        </div>
      </footer>
    </div>
  );
}
