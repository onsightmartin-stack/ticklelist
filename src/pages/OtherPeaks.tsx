import { Mountain, ArrowLeft } from "lucide-react";
import { Link } from "@/lib/router-compat";
import Seo from "@/components/Seo";
import Navbar from "@/components/Navbar";
import { otherPeaks } from "@/data/other-peaks";

const OtherPeaks = () => {
  // Group by location
  const grouped = otherPeaks.reduce<Record<string, typeof otherPeaks>>((acc, p) => {
    if (!acc[p.location]) acc[p.location] = [];
    acc[p.location]!.push(p);
    return acc;
  }, {});

  const listSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Other Peaks & Side Trips",
    description:
      "Summits and notable points climbed by Martin Gårdling that aren't country highpoints.",
    url: "https://onsightmartin.com/other-peaks",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: otherPeaks.length,
      itemListElement: otherPeaks.slice(0, 100).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Mountain",
          name: p.name,
          ...(p.elevation ? { elevation: `${p.elevation}` } : {}),
          ...(p.location ? { address: { "@type": "PostalAddress", addressCountry: p.location } } : {}),
        },
      })),
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Other Peaks & Side Trips — Onsight Martin"
        description="Beyond the country high points: training climbs, side trips and bucket-list summits, with elevations and dates for every peak logged."
        path="/other-peaks"
        jsonLd={listSchema}
      />
      <Navbar />

      <div className="pt-20 container mx-auto px-4 pb-16 md:pb-24">
        <Link to="/" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Highpoints
        </Link>

        <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-2">Other Peaks</h1>
        <p className="text-muted-foreground mb-10 max-w-lg">
          Summits and notable points that aren't country highpoints — side trips, training climbs, and bucket-list viewpoints.
        </p>

        <div className="mb-4 text-sm text-muted-foreground">
          {otherPeaks.length} peaks logged
        </div>

        {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([location, peaks]) => (
          <div key={location} className="mb-8">
            <h2 className="font-display text-lg text-primary tracking-wider mb-3 border-b border-border pb-2">{location}</h2>
            <div className="grid gap-2">
              {peaks.sort((a, b) => {
                const elevA = parseInt(a.elevation.replace(/[^0-9]/g, ""));
                const elevB = parseInt(b.elevation.replace(/[^0-9]/g, ""));
                return elevB - elevA;
              }).map(peak => (
                <div key={`${peak.name}-${peak.date}`} className="flex items-center gap-3 py-2 px-3 rounded-sm bg-card hover:bg-secondary transition-colors">
                  <Mountain className="w-4 h-4 flex-shrink-0 text-primary" />
                  <span className="font-medium text-foreground min-w-[140px] md:min-w-[200px]">{peak.name}</span>
                  <span className="text-muted-foreground text-sm flex-1 hidden sm:inline">{peak.note || ""}</span>
                  <span className="text-muted-foreground text-sm">{peak.elevation}</span>
                  <span className="text-primary text-xs font-display">{peak.date.slice(0, 4)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <footer className="bg-background border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} Onsight Martin — Martin Gårdling</p>
        </div>
      </footer>
    </div>
  );
};

export default OtherPeaks;
