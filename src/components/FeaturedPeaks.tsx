import { Link } from "@/lib/router-compat";
import { ArrowRight, Mountain } from "lucide-react";
import PeakImage from "@/components/PeakImage";
import { slugify } from "@/lib/slug";
import { peakDetails } from "@/data/peak-details";
import { countries } from "@/data/countries";

// Curated set of the most important peak pages to surface on the homepage.
const FEATURED_COUNTRIES = [
  "France",
  "Germany",
  "Ireland",
  "Tanzania",
  "Slovenia",
  "Spain",
];

export default function FeaturedPeaks() {
  const featured = FEATURED_COUNTRIES.map((country) => {
    const detail = peakDetails[country];
    const entry = countries.find((c) => c.country === country);
    if (!detail || !entry) return null;
    return { country, detail, entry };
  }).filter(Boolean) as {
    country: string;
    detail: (typeof peakDetails)[string];
    entry: (typeof countries)[number];
  }[];

  if (featured.length === 0) return null;

  return (
    <section id="featured" className="container mx-auto px-4 py-12 md:py-16">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Featured Peaks
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl">
            Deep dives into the high points that shaped the journey — route notes, stats and
            summit stories.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {featured.map(({ country, detail, entry }) => (
          <Link
            key={country}
            to={`/peak/${slugify(country)}`}
            className="group block rounded-lg overflow-hidden border border-border bg-card hover:border-primary transition-colors"
          >
            <div className="relative h-44 overflow-hidden bg-secondary">
              <PeakImage
                src={detail.photoUrl}
                alt={`${detail.peak}, the highest mountain in ${country}`}
                width={800}
                height={450}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{country}</p>
                <h3 className="font-display text-xl font-bold text-foreground leading-tight">
                  {detail.peak}
                </h3>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mountain className="h-4 w-4 text-primary" aria-hidden="true" />
                  {entry.elevation}
                </span>
                <span className="truncate">{detail.range}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {detail.description}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                View peak page
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
