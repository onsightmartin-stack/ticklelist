import { ArrowLeft } from "lucide-react";
import { Link } from "@/lib/router-compat";
import Navbar from "@/components/Navbar";
import type { DirectoryPeak } from "@/lib/peak-directory.functions";
import { countryName } from "@/pages/WorldPeakPage";

interface Props {
  code: string;
  peaks: DirectoryPeak[];
}

const PeakCountryPage = ({ code, peaks }: Props) => {
  const name = countryName(code.toUpperCase()) ?? code.toUpperCase();
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Link
          to="/peaks"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Peak directory
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-foreground">Highest peaks in {name}</h1>
        <p className="mt-2 text-muted-foreground">
          The most prominent summits in {name} with elevation, prominence and community ascents.
        </p>

        {peaks.length === 0 ? (
          <p className="mt-8 text-muted-foreground">No catalogued peaks for this country yet.</p>
        ) : (
          <ol className="mt-6 grid gap-2 sm:grid-cols-2">
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
                    {p.prominence ? ` · ${p.prominence} m prom` : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  );
};

export default PeakCountryPage;
