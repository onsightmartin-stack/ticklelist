import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Mountain, Instagram, Youtube, ExternalLink, ChevronDown, CheckCircle2, MapPin, Circle, Diamond, Shield, ArrowDownUp, AlertTriangle, Newspaper, Play, ArrowRight } from "lucide-react";
import { Link, useSearchParams } from "@/lib/router-compat";
import { useQuery } from "@tanstack/react-query";
import { slugify } from "@/lib/slug";
import { useCountryWarnings } from "@/hooks/useCountryWarnings";
import { advisoryDetails, cautionNotes, getNewsUrl } from "@/data/advisory-details";
import heroSummit from "@/assets/hero-summit.png";
import heroLake from "@/assets/hero-lake.jpg";
import Navbar from "@/components/Navbar";
import UnMemberBadge from "@/components/UnMemberBadge";
import PeakRefLinks from "@/components/PeakRefLinks";
import TrackedLink from "@/components/TrackedLink";

import MatchMeCta from "@/components/MatchMeCta";
import { peakDetails } from "@/data/peak-details";
import { guides } from "@/data/guides";
import { personalNotes } from "@/data/personal-notes";
import { countries, getClimbed, getMainlandClimbed, getLegalHighPoint, getVisited, getNotVisited, TOTAL_TARGET, type ClimbStatus } from "@/data/countries";
import { useLinkedProgress } from "@/hooks/useLinkedProgress";
import { supabase } from "@/integrations/supabase/client";
import WorldMap from "@/components/WorldMap";
import CrossSiteLink from "@/components/CrossSiteLink";
import { communityHref, COMMUNITY_NAME } from "@/lib/site-links";

type LatestVideo = {
  id: string;
  video_id: string;
  video_title: string;
  video_url: string;
  thumbnail_url: string | null;
  published_at: string | null;
  peak_name: string | null;
  country: string | null;
};

const statusConfig: Record<ClimbStatus, { label: string; icon: typeof CheckCircle2; colorClass: string; bgClass: string }> = {
  climbed: { label: "Summited", icon: CheckCircle2, colorClass: "text-ice", bgClass: "bg-ice/20" },
  mainland_climbed: { label: "Mainland HP", icon: Diamond, colorClass: "text-mainland", bgClass: "bg-accent/20" },
  legal_high_point: { label: "Legal HP", icon: Shield, colorClass: "text-legal", bgClass: "bg-mainland/20" },
  visited: { label: "Visited", icon: MapPin, colorClass: "text-accent", bgClass: "" },
  not_visited: { label: "Not Yet Climbed", icon: Circle, colorClass: "text-muted-foreground", bgClass: "" },
};

type FilterTab = "all" | ClimbStatus | "warnings" | "eu_mainland";
type SortMode = "continent" | "recent" | "elevation";

const parseElevation = (elev: string) => parseInt(elev.replace(/[^0-9]/g, ''), 10) || 0;

const FILTER_KEYS: FilterTab[] = ["all", "climbed", "mainland_climbed", "legal_high_point", "visited", "not_visited", "warnings", "eu_mainland"];

const Index = () => {
  const [searchParams] = useSearchParams();
  const paramFilter = searchParams.get("filter");
  const paramCountry = searchParams.get("country");
  const initialFilter: FilterTab = paramFilter && FILTER_KEYS.includes(paramFilter as FilterTab) ? (paramFilter as FilterTab) : "all";
  const [filter, setFilter] = useState<FilterTab>(initialFilter);
  const [sortMode, setSortMode] = useState<SortMode>("continent");
  const [expandedCountry, setExpandedCountry] = useState<string | null>(paramCountry);
  const [expandedContinents, setExpandedContinents] = useState<Set<string>>(new Set());
  const { data: warnings = [] } = useCountryWarnings();
  const warningMap = useMemo(() => new Map(warnings.map(w => [w.country_name, w])), [warnings]);

  useEffect(() => {
    if (paramFilter && FILTER_KEYS.includes(paramFilter as FilterTab)) setFilter(paramFilter as FilterTab);
    if (paramCountry) {
      setExpandedCountry(paramCountry);
      const match = countries.find(c => c.country === paramCountry);
      if (match) setExpandedContinents(prev => new Set(prev).add(match.continent));
    }
    if (paramFilter || paramCountry) {
      requestAnimationFrame(() => {
        document.getElementById("progress")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [paramFilter, paramCountry]);


  const { data: latestVideo } = useQuery({
    queryKey: ["latest-youtube-video"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("youtube_climbs")
        .select("id, video_id, video_title, video_url, thumbnail_url, published_at, peak_name, country")
        .eq("status", "confirmed")
        .order("published_at", { ascending: false })
        .limit(1)
        .single();
      if (error) return null;
      return data as LatestVideo;
    },
  });

  // Keeps this page in sync with Martin's Ticklelist profile (same person).
  useLinkedProgress();

  const climbed = getClimbed();
  const mainlandClimbed = getMainlandClimbed();
  const legalHighPoint = getLegalHighPoint();
  const visited = getVisited();
  const notVisited = getNotVisited();
  const euMainland = countries.filter(c => c.continent === "Europe" && c.status === "mainland_climbed");

  const detailLookup = useMemo(() => peakDetails, []);
  const visitedTotal = climbed.length + mainlandClimbed.length + legalHighPoint.length + visited.length + 1; // +1 for Hong Kong (visited pre-handover)
  const filtered = filter === "all" ? countries : filter === "warnings" ? countries.filter(c => warningMap.has(c.country)) : filter === "climbed" ? countries.filter(c => (c.status === "climbed" || c.status === "legal_high_point") && c.unMember !== false) : filter === "visited" ? countries.filter(c => c.status !== "not_visited") : filter === "not_visited" ? countries.filter(c => c.status !== "climbed" && c.status !== "legal_high_point") : filter === "eu_mainland" ? euMainland : countries.filter(c => c.status === filter);

  const grouped = filtered.reduce<Record<string, typeof countries>>((acc, c) => {
    if (!acc[c.continent]) acc[c.continent] = [];
    acc[c.continent]!.push(c);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Onsight Martin — Climbing Every Country's Highest Peak</title>
        <meta name="description" content={`Martin Gårdling's country highpointing project. ${climbed.length + legalHighPoint.length} of ${TOTAL_TARGET} highest peaks summited. Follow the journey to climb every country's highest mountain.`} />
        <meta name="keywords" content="country highpointing, highest peak every country, mountain climbing, Martin Gårdling, highpoint challenge, mountaineering, summit tracker" />
        <link rel="canonical" href="https://onsightmartin.com/" />
        <meta property="og:title" content="Onsight Martin — Country Highpointing" />
        <meta property="og:description" content={`Climbing the highest mountain of every country on Earth. ${climbed.length + legalHighPoint.length} of ${TOTAL_TARGET} summited.`} />
        <meta property="og:url" content="https://onsightmartin.com/" />
        <meta property="og:image" content="https://onsightmartin.com/og-image.jpg" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Onsight Martin",
          "url": "https://onsightmartin.com",
          "description": `Martin Gårdling's country highpointing project — ${climbed.length + legalHighPoint.length} of ${TOTAL_TARGET} summited.`,
          "author": { "@type": "Person", "name": "Martin Gårdling", "url": "https://www.youtube.com/@onsightmartin" }
        })}</script>
      </Helmet>
      <Navbar />

      <section id="top" className="relative h-[76vh] md:h-[90vh] flex items-end overflow-hidden">
        <img
          src={heroLake}
          alt="Martin Gårdling standing beside a glacial mountain lake during his country highpointing expedition"
          width={2400}
          height={1600}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-[70%_30%] md:object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="relative container mx-auto px-4 pb-16 md:pb-24 overflow-hidden">
          <p className="text-primary font-display tracking-[0.2em] sm:tracking-[0.3em] text-xs sm:text-sm mb-2 animate-fade-in [animation-delay:200ms] opacity-0 [animation-fill-mode:forwards]">Country Highpointing — {TOTAL_TARGET} Countries</p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-foreground leading-[0.9] mb-4">
            <span className="inline-block animate-[slide-in-left_0.8s_ease-out_forwards] [animation-fill-mode:both]">Onsight</span>
            <br />
            <span className="inline-block animate-[slide-in-left_0.8s_ease-out_0.2s_forwards] [animation-fill-mode:both]">Martin</span>
            <span className="sr-only"> — Climbing Every Country's Highest Peak</span>
          </h1>

          <p className="text-muted-foreground max-w-md text-lg leading-relaxed animate-fade-in [animation-delay:600ms] opacity-0 [animation-fill-mode:forwards]">
            Climbing the highest mountain of every country on Earth. {climbed.length + legalHighPoint.length} of {TOTAL_TARGET} summited.
            Every highpoint is documented on my{" "}
            <TrackedLink href="https://www.youtube.com/@onsightmartin" kind="youtube_channel" trackLabel="Intro text link" className="text-primary hover:underline">YouTube channel</TrackedLink>.
             {" "}Follow my world record attempt — or try{" "}
             <CrossSiteLink href={communityHref("/")} className="text-primary hover:underline">Ticklelist</CrossSiteLink>
             {" "}to tick ascents, document travels, make bucketlists and friends along the way.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5 animate-fade-in [animation-delay:800ms] opacity-0 [animation-fill-mode:forwards]">
            <a href="#map" className="inline-flex items-center gap-2 text-primary font-display tracking-wider text-sm hover:gap-3 transition-all">
              View Progress <ChevronDown className="w-4 h-4 animate-bounce" />
            </a>
            <CrossSiteLink href={communityHref("/")} className="inline-flex items-center gap-2 text-foreground font-display tracking-wider text-sm hover:text-primary transition-colors">
              <Mountain className="w-4 h-4" /> Join the Ticklelist
            </CrossSiteLink>
            <Link to="/highest-mountains" className="inline-flex items-center gap-2 text-foreground font-display tracking-wider text-sm hover:text-primary transition-colors">
              <Mountain className="w-4 h-4" /> Highest mountain in every country
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-secondary border-y border-border">
        <div className="container mx-auto px-4 py-8 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="font-display text-3xl md:text-5xl font-bold text-primary">{climbed.length + legalHighPoint.length}</p>
            <p className="text-muted-foreground text-xs md:text-sm tracking-wider uppercase mt-1">Summited</p>
          </div>
          <div>
            <p className="font-display text-3xl md:text-5xl font-bold text-accent">{visitedTotal}</p>
            <p className="text-muted-foreground text-xs md:text-sm tracking-wider uppercase mt-1">Countries Visited</p>
          </div>
          <div>
            <p className="font-display text-3xl md:text-5xl font-bold text-muted-foreground">{TOTAL_TARGET - climbed.length - legalHighPoint.length}</p>
            <p className="text-muted-foreground text-xs md:text-sm tracking-wider uppercase mt-1">Countries Remaining</p>
          </div>
        </div>
      </section>

      {latestVideo && (
        <section className="bg-background border-b border-border">
          <div className="container mx-auto px-4 py-10 md:py-14">
            <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center">
              <a
                href={latestVideo.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative w-full md:w-3/5 lg:w-1/2 aspect-video rounded-lg overflow-hidden group shrink-0"
              >
                {latestVideo.thumbnail_url ? (
                  <img
                    src={latestVideo.thumbnail_url}
                    alt={`Latest video thumbnail: ${latestVideo.video_title}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    width={640}
                    height={360}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="w-full h-full bg-secondary flex items-center justify-center">
                    <Youtube className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-red-600 text-white flex items-center justify-center pl-1 shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-7 h-7 md:w-8 md:h-8 fill-current" />
                  </div>
                </div>
              </a>
              <div className="flex-1 text-center md:text-left">
                <p className="text-primary font-display tracking-[0.2em] text-xs uppercase mb-2">Latest on YouTube</p>
                <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 line-clamp-2">
                  {latestVideo.video_title}
                </h2>
                {(latestVideo.peak_name || latestVideo.country) && (
                  <p className="text-muted-foreground mb-4">
                    {latestVideo.peak_name}
                    {latestVideo.peak_name && latestVideo.country && " · "}
                    {latestVideo.country}
                  </p>
                )}
                <p className="text-muted-foreground text-sm mb-6">
                  {latestVideo.published_at
                    ? new Date(latestVideo.published_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Recently published"}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <TrackedLink
                    href={latestVideo.video_url}
                    kind="youtube_video"
                    videoId={latestVideo.video_id}
                    trackLabel={latestVideo.video_title}
                    className="inline-flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-sm font-display tracking-wider text-sm hover:bg-red-700 transition-colors"
                  >
                    <Youtube className="w-4 h-4" /> Watch on YouTube
                  </TrackedLink>
                  <TrackedLink
                    href="https://www.youtube.com/@onsightmartin?sub_confirmation=1"
                    kind="youtube_channel"
                    trackLabel="Subscribe (home hero)"
                    className="inline-flex items-center justify-center gap-2 border border-red-600 text-red-500 px-6 py-3 rounded-sm font-display tracking-wider text-sm hover:bg-red-600 hover:text-white transition-colors"
                  >
                    <Youtube className="w-4 h-4" /> Subscribe
                  </TrackedLink>

                  {latestVideo.country && (
                    <Link
                      to={`/peak/${slugify(latestVideo.country)}`}
                      className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-sm font-display tracking-wider text-sm hover:opacity-90 transition-opacity"
                    >
                      <Mountain className="w-4 h-4" /> Peak page
                    </Link>
                  )}
                  <MatchMeCta country={latestVideo.country} peakName={latestVideo.peak_name ?? undefined} variant="inline" />
                  <Link
                    to="/latest"
                    className="inline-flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-6 py-3 rounded-sm font-display tracking-wider text-sm hover:bg-muted transition-colors"
                  >
                    More videos <ArrowRight className="w-4 h-4" />
                  </Link>

                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="bg-secondary/30 border-b border-border">
        <div className="container mx-auto px-4 py-10">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
            Highpointing guides &amp; lists
          </h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-2xl">
            Ranked lists of the highest mountain in every country — the full list, the easiest ticks,
            the hardest expeditions and the best first summits.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((g) => (
              <Link
                key={g.slug}
                to={`/guides/${g.slug}`}
                className="flex items-center justify-between gap-3 bg-card border border-border rounded-lg px-4 py-3 hover:border-primary/50 transition-colors"
              >
                <span className="text-foreground text-sm">{g.heading}</span>
                <ArrowRight className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>



      <section className="relative">
        <img
          src={heroSummit}
          alt="Martin Gårdling on a snowy summit ridge, arms raised after reaching a country high point"
          width={2400}
          height={1350}
          loading="lazy"
          decoding="async"
          className="w-full h-64 md:h-96 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent flex items-end md:items-center pb-8 md:pb-0">
          <div className="container mx-auto px-4">
            <blockquote className="max-w-sm">
              <p className="text-foreground font-display text-2xl md:text-3xl italic leading-snug">
                "Do it or do not — There is no try"
              </p>
              <footer className="mt-2 text-sm text-muted-foreground">— Yoda, Star Wars</footer>
            </blockquote>
          </div>
        </div>
      </section>

      <section id="map" className="container mx-auto px-4 py-12 md:py-16">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">World Map</h2>
        <p className="text-muted-foreground mb-6 max-w-lg">
          Zoom, pan, and tap countries to explore progress across the globe.
        </p>
        <div className="min-h-[300px] md:min-h-[450px]">
          <WorldMap />
        </div>
        {warnings.length > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-sm bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>
              <strong>{warnings.length}</strong> countries with active armed conflicts.
              {" "}Last updated: {new Date(warnings[0]!.last_checked_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}.
              {" "}Source: ACLED / ICG.
            </span>
          </div>
        )}
      </section>

      <section id="progress" className="container mx-auto px-4 py-16 md:py-24">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">Country Highpoints</h2>
        <p className="text-muted-foreground mb-8 max-w-lg">
          Tracking progress toward summiting the highest peak in every country. Filter by status below.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {([
            { key: "all" as FilterTab, label: "All", count: TOTAL_TARGET },
            { key: "climbed" as FilterTab, label: "Summited", count: climbed.length + legalHighPoint.length },
            { key: "mainland_climbed" as FilterTab, label: "Mainland HP", count: mainlandClimbed.length },
            { key: "eu_mainland" as FilterTab, label: "EU Mainland HP", count: euMainland.length },
            { key: "visited" as FilterTab, label: "Visited", count: visitedTotal },
            { key: "not_visited" as FilterTab, label: "Not Yet Climbed", count: TOTAL_TARGET - climbed.length - legalHighPoint.length },
            ...(warnings.length > 0 ? [{ key: "warnings" as FilterTab, label: "⚠ Conflicts", count: warnings.length }] : []),
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-sm text-sm font-display tracking-wider transition-colors ${
                filter === tab.key
                  ? tab.key === "warnings" ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
                  : tab.key === "warnings" ? "bg-destructive/10 text-destructive hover:bg-destructive/20" : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setSortMode("continent")}
            className={`px-4 py-2 rounded-sm text-sm font-display tracking-wider transition-colors flex items-center gap-1.5 ${
              sortMode === "continent" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"
            }`}
          >
            By Continent
          </button>
          <button
            onClick={() => setSortMode("recent")}
            className={`px-4 py-2 rounded-sm text-sm font-display tracking-wider transition-colors flex items-center gap-1.5 ${
              sortMode === "recent" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"
            }`}
          >
            <ArrowDownUp className="w-3.5 h-3.5" /> Most Recent
          </button>
          <button
            onClick={() => setSortMode("elevation")}
            className={`px-4 py-2 rounded-sm text-sm font-display tracking-wider transition-colors flex items-center gap-1.5 ${
              sortMode === "elevation" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"
            }`}
          >
            <Mountain className="w-3.5 h-3.5" /> By Elevation
          </button>
        </div>

        {sortMode === "recent" || sortMode === "elevation" ? (
          <div className="mb-8">
            <h3 className="font-display text-lg text-primary tracking-wider mb-3 border-b border-border pb-2 flex items-center justify-between">
              <span>{sortMode === "recent" ? "Most Recently Climbed" : "Sorted by Elevation"}</span>
              <span className="text-xs text-primary tracking-wider">Elevation / Date</span>
            </h3>
            <div className="grid gap-2">
              {[...filtered]
                .filter(c => sortMode === "recent" ? c.year : true)
                .sort((a, b) => sortMode === "recent"
                  ? ((b.year || 0) * 100 + (b.month || 0)) - ((a.year || 0) * 100 + (a.month || 0))
                  : parseElevation(b.elevation) - parseElevation(a.elevation)
                )
                .map(peak => {
                  const config = statusConfig[peak.status];
                  const Icon = config.icon;
                  return (
                    <div key={peak.country}>
                      <div
                        onClick={() => setExpandedCountry(expandedCountry === peak.country ? null : peak.country)}
                        className={`flex items-center gap-3 py-2 px-3 rounded-sm cursor-pointer ${config.bgClass || 'bg-card'} hover:bg-secondary transition-colors group`}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${config.colorClass}`} />
                        <span className="font-medium text-foreground min-w-[120px] md:min-w-[160px] flex items-center gap-1.5">
                          <Link to={`/peak/${slugify(peak.country)}`} className="hover:text-primary hover:underline">
                            {peak.country}
                          </Link>
                          <UnMemberBadge unMember={peak.unMember} />
                          {warningMap.has(peak.country) && (
                            <span title={warningMap.get(peak.country)?.advisory_text || "Travel advisory"}>
                              <AlertTriangle className={`w-3.5 h-3.5 ${warningMap.get(peak.country)!.advisory_level >= 4 ? 'text-destructive' : 'text-orange-500'}`} />
                            </span>
                          )}
                        </span>
                        <span className="text-muted-foreground text-sm flex-1">
                          {peak.highPoint}
                          {peak.note && <span className="text-mainland text-xs ml-1">({peak.note})</span>}
                        </span>
                        <span className="text-muted-foreground text-xs sm:text-sm">{peak.elevation}</span>
                        {peak.year && <span className="text-ice text-xs font-display">{peak.year}</span>}
                        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${expandedCountry === peak.country ? 'rotate-180' : ''}`} />
                      </div>
                      {expandedCountry === peak.country && (
                        <div className="ml-7 mr-3 mt-1 mb-2 p-3 rounded-sm bg-secondary/60 border border-border text-sm space-y-1">
                          <p className="text-foreground"><span className="text-muted-foreground">Date climbed:</span> {peak.year ? `${peak.month ? `${peak.month}/` : ''}${peak.year}` : 'Not yet climbed'}</p>
                          <PeakRefLinks peak={peak.highPoint} country={peak.country} youtubeUrl={detailLookup[peak.country]?.youtubeUrl} className="pb-1" />
                          {(peak.status === "climbed" || peak.status === "legal_high_point") && (() => {
                            const d = detailLookup[peak.country];
                            const url = d?.youtubeUrl;
                            if (!url) return null;
                            return (
                              <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                                <Youtube className="h-3.5 w-3.5" /> Watch summit video →
                              </a>
                            );
                          })()}
                          {warningMap.has(peak.country) && (() => {
                            const w = warningMap.get(peak.country)!;
                            const detail = advisoryDetails[peak.country];
                            return (
                              <div className="space-y-1.5 rounded-sm bg-destructive/10 border border-destructive/30 p-2">
                                <p className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                  {w.advisory_text}
                                </p>
                                {detail && (
                                  <>
                                    <p className="text-xs text-foreground"><span className="font-medium">Why:</span> {detail.reason}</p>
                                    <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">⚠ Caution:</span> {detail.caution}</p>
                                    <a href={getNewsUrl(detail.newsQuery)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                                      <Newspaper className="h-3 w-3" /> Latest news →
                                    </a>
                                  </>
                                )}
                              </div>
                            );
                          })()}
                          {!warningMap.has(peak.country) && cautionNotes[peak.country] && (
                            <div className="space-y-1 rounded-sm bg-muted/60 border border-border p-2">
                              <p className="text-xs text-foreground"><span className="font-medium">⚠ Take care:</span> {cautionNotes[peak.country]!.note}</p>
                              <a href={getNewsUrl(cautionNotes[peak.country]!.newsQuery)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                                <Newspaper className="h-3 w-3" /> Latest news →
                              </a>
                            </div>
                          )}
                          {personalNotes[peak.country] && (
                            <p className="text-xs text-foreground leading-relaxed italic">{personalNotes[peak.country]}</p>
                          )}
                          {!personalNotes[peak.country] && !warningMap.has(peak.country) && !cautionNotes[peak.country] && <p className="text-muted-foreground italic text-xs">More info coming — under development 🏔️</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ) : (
          Object.entries(grouped).sort(([, aPeaks], [, bPeaks]) => {
            const climbedStatuses = ["climbed", "mainland_climbed", "legal_high_point"];
            const aClimbed = aPeaks.filter(p => climbedStatuses.includes(p.status) && p.unMember !== false).length;
            const bClimbed = bPeaks.filter(p => climbedStatuses.includes(p.status) && p.unMember !== false).length;
            return bClimbed - aClimbed;
          }).map(([continent, peaks]) => {
            const isOpen = expandedContinents.has(continent);
            const climbedStatuses2 = ["climbed", "mainland_climbed", "legal_high_point"];
            const continentTotal = countries.filter(c => c.continent === continent && c.unMember !== false).length;
            const summitedCount = countries.filter(c => c.continent === continent && climbedStatuses2.includes(c.status) && c.unMember !== false).length;
            return (
            <div key={continent} className="mb-2">
              <button
                onClick={() => {
                  setExpandedContinents(prev => {
                    const next = new Set(prev);
                    if (next.has(continent)) next.delete(continent);
                    else next.add(continent);
                    return next;
                  });
                }}
                className="w-full flex items-center justify-between py-3 px-3 rounded-sm bg-secondary hover:bg-muted transition-colors cursor-pointer"
              >
                <h3 className="font-display text-lg text-primary tracking-wider">{continent}</h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{summitedCount}/{continentTotal} summited</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>
              {isOpen && (
              <div className="grid gap-2 mt-2 ml-2">
                {peaks.sort((a, b) => a.country.localeCompare(b.country)).map(peak => {
                  const config = statusConfig[peak.status];
                  const Icon = config.icon;

                  return (
                    <div key={peak.country}>
                      <div
                        onClick={() => setExpandedCountry(expandedCountry === peak.country ? null : peak.country)}
                        className={`flex items-center gap-3 py-2 px-3 rounded-sm cursor-pointer ${config.bgClass || 'bg-card'} hover:bg-secondary transition-colors group`}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${config.colorClass}`} />
                        <span className="font-medium text-foreground min-w-[120px] md:min-w-[160px] flex items-center gap-1.5">
                          <Link to={`/peak/${slugify(peak.country)}`} className="hover:text-primary hover:underline">
                            {peak.country}
                          </Link>
                          <UnMemberBadge unMember={peak.unMember} />
                          {warningMap.has(peak.country) && (
                            <span title={warningMap.get(peak.country)?.advisory_text || "Travel advisory"}>
                              <AlertTriangle className={`w-3.5 h-3.5 ${warningMap.get(peak.country)!.advisory_level >= 4 ? 'text-destructive' : 'text-orange-500'}`} />
                            </span>
                          )}
                        </span>
                        <span className="text-muted-foreground text-sm flex-1">
                          {peak.highPoint}
                          {peak.note && <span className="text-mainland text-xs ml-1">({peak.note})</span>}
                        </span>
                        <span className="text-muted-foreground text-xs sm:text-sm">{peak.elevation}</span>
                        {peak.year && <span className="text-ice text-xs font-display">{peak.year}</span>}
                        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${expandedCountry === peak.country ? 'rotate-180' : ''}`} />
                      </div>
                      {expandedCountry === peak.country && (
                        <div className="ml-7 mr-3 mt-1 mb-2 p-3 rounded-sm bg-secondary/60 border border-border text-sm space-y-1">
                          <p className="text-foreground"><span className="text-muted-foreground">Date climbed:</span> {peak.year ? `${peak.month ? `${peak.month}/` : ''}${peak.year}` : 'Not yet climbed'}</p>
                          <PeakRefLinks peak={peak.highPoint} country={peak.country} youtubeUrl={detailLookup[peak.country]?.youtubeUrl} className="pb-1" />
                          {(peak.status === "climbed" || peak.status === "legal_high_point") && (() => {
                            const d = detailLookup[peak.country];
                            const url = d?.youtubeUrl;
                            if (!url) return null;
                            return (
                              <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                                <Youtube className="h-3.5 w-3.5" /> Watch summit video →
                              </a>
                            );
                          })()}
                          {warningMap.has(peak.country) && (() => {
                            const w = warningMap.get(peak.country)!;
                            const detail = advisoryDetails[peak.country];
                            return (
                              <div className="space-y-1.5 rounded-sm bg-destructive/10 border border-destructive/30 p-2">
                                <p className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                  {w.advisory_text}
                                </p>
                                {detail && (
                                  <>
                                    <p className="text-xs text-foreground"><span className="font-medium">Why:</span> {detail.reason}</p>
                                    <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">⚠ Caution:</span> {detail.caution}</p>
                                    <a href={getNewsUrl(detail.newsQuery)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                                      <Newspaper className="h-3 w-3" /> Latest news →
                                    </a>
                                  </>
                                )}
                              </div>
                            );
                          })()}
                          {!warningMap.has(peak.country) && cautionNotes[peak.country] && (
                            <div className="space-y-1 rounded-sm bg-muted/60 border border-border p-2">
                              <p className="text-xs text-foreground"><span className="font-medium">⚠ Take care:</span> {cautionNotes[peak.country]!.note}</p>
                              <a href={getNewsUrl(cautionNotes[peak.country]!.newsQuery)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                                <Newspaper className="h-3 w-3" /> Latest news →
                              </a>
                            </div>
                          )}
                          {personalNotes[peak.country] && (
                            <p className="text-xs text-foreground leading-relaxed italic">{personalNotes[peak.country]}</p>
                          )}
                          {!personalNotes[peak.country] && !warningMap.has(peak.country) && !cautionNotes[peak.country] && <p className="text-muted-foreground italic text-xs">More info coming — under development 🏔️</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              )}
            </div>
          );})
        )}

        <div className="mt-8 text-center">
          <Link to="/other-peaks" className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-6 py-3 rounded-sm hover:bg-muted transition-colors font-display tracking-wider text-sm">
            <Mountain className="w-4 h-4 text-primary" /> View Other Peaks
          </Link>
        </div>
      </section>

      <section id="about" className="bg-secondary border-t border-border">
        <div className="container mx-auto px-4 py-16 md:py-24 max-w-2xl text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">About the Project</h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            I'm Martin Gårdling — a climber, adventurer, and filmmaker from Sweden. My goal is to stand on the highest point of every country in the world. Follow along on my journey through the mountains.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <CrossSiteLink href={communityHref("/")} className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-sm hover:opacity-90 transition-opacity font-display tracking-wider text-sm">
              <Mountain className="w-4 h-4" /> Join the Ticklelist
            </CrossSiteLink>
            <TrackedLink href="https://www.youtube.com/@onsightmartin" kind="youtube_channel" trackLabel="About section" className="flex items-center gap-2 bg-card text-foreground px-5 py-3 rounded-sm hover:bg-muted transition-colors font-display tracking-wider text-sm">
              <Youtube className="w-4 h-4 text-primary" /> YouTube
            </TrackedLink>
            <a href="https://www.instagram.com/onsightmartin" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-card text-foreground px-5 py-3 rounded-sm hover:bg-muted transition-colors font-display tracking-wider text-sm">
              <Instagram className="w-4 h-4 text-primary" /> Instagram
            </a>
            <a href="https://www.summitpost.org" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-card text-foreground px-5 py-3 rounded-sm hover:bg-muted transition-colors font-display tracking-wider text-sm">
              <ExternalLink className="w-4 h-4 text-primary" /> Summitpost
            </a>
            <a href="https://www.peakbagger.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-card text-foreground px-5 py-3 rounded-sm hover:bg-muted transition-colors font-display tracking-wider text-sm">
              <ExternalLink className="w-4 h-4 text-primary" /> Peakbagger
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-background border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} Onsight Martin — Martin Gårdling</p>
          <p className="mt-1 text-xs">Photos by Martin Gårdling</p>
          <p className="mt-3 text-xs">
            Looking for the climbing community?{" "}
            <CrossSiteLink href={communityHref("/")} className="text-primary hover:underline">
              {COMMUNITY_NAME}
            </CrossSiteLink>{" "}
            — a separate site for logging ascents and finding partners.
          </p>
          <p className="mt-3 text-xs hidden md:block">
            Also check out our friends:{" "}
            <a
              href="https://countryhighpoints.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              countryhighpoints.com
            </a>
          </p>
          <p className="mt-3 text-xs">
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
