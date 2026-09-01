import { Mountain, Globe2 } from "lucide-react";
import { Link } from "@/lib/router-compat";
import Navbar from "@/components/Navbar";
import type { DirectoryCountry, DirectoryPeak } from "@/lib/peak-directory.functions";
import { countryName } from "@/pages/WorldPeakPage";

interface Props {
  countries: DirectoryCountry[];
  peaks: DirectoryPeak[];
}

const PeakDirectoryPage = ({ countries, peaks }: Props) => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold text-foreground">Peak directory</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Browse over a million catalogued summits — elevation, prominence, coordinates and who in the
        Ticklelist community has climbed them. Log your own ascents for free.
      </p>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
          <Mountain className="h-5 w-5" /> Most prominent peaks on Earth
        </h2>
        <ol className="mt-4 grid gap-2 sm:grid-cols-2">
          {peaks.map((p, i) => (
            <li key={p.id}>
              <Link
                to={`/peaks/${p.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/60 px-3 py-2 text-sm hover:border-primary/60"
              >
                <span className="truncate text-foreground">
                  <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                  {p.name}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {p.elevation ? `${p.elevation} m` : ""}
                  {p.countryCode ? ` · ${p.countryCode}` : ""}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
          <Globe2 className="h-5 w-5" /> Peaks by country
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {countries.map((c) => (
            <Link
              key={c.code}
              to={`/peaks/country/${c.code.toLowerCase()}`}
              className="rounded-lg border border-border bg-card/60 px-3 py-2 text-sm hover:border-primary/60"
            >
              <span className="block truncate text-foreground">{countryName(c.code)}</span>
              <span className="text-xs text-muted-foreground">
                {c.peakCount.toLocaleString()} peaks
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  </div>
);

export default PeakDirectoryPage;
