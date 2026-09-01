import { ArrowLeft, Mountain, MapPin, TrendingUp, Globe2, Ruler, Anchor } from "lucide-react";
import { Link } from "@/lib/router-compat";
import Navbar from "@/components/Navbar";
import LazyPeakMapPreview from "@/components/LazyPeakMapPreview";
import PeakAscentRegistry from "@/components/community/PeakAscentRegistry";
import type { WorldPeakDetail, PeakAscentEntry } from "@/lib/peak-detail.functions";
import { formatElevation } from "@/lib/units";
import { useUnits } from "@/hooks/useUnits";

export const countryName = (code: string | null | undefined) => {
  if (!code) return null;
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
};

const dms = (value: number, positive: string, negative: string) => {
  const hemi = value >= 0 ? positive : negative;
  const abs = Math.abs(value);
  const deg = Math.floor(abs);
  const minFloat = (abs - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = Math.round((minFloat - min) * 60);
  return `${deg}° ${min}′ ${sec}″ ${hemi}`;
};

const Stat = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mountain;
  label: string;
  value: string;
}) => (
  <div className="rounded-lg border border-border bg-card/60 p-4">
    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
    <div className="mt-1 text-lg font-semibold text-foreground">{value}</div>
  </div>
);

interface Props {
  peak: WorldPeakDetail | null;
  ascents?: PeakAscentEntry[];
}

const WorldPeakPage = ({ peak, ascents = [] }: Props) => {
  const units = useUnits();
  if (!peak) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-foreground">Peak not found</h1>
          <p className="mt-2 text-muted-foreground">
            This peak isn’t in the catalog — try searching for it again.
          </p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to search
          </Link>
        </main>
      </div>
    );
  }

  const country = countryName(peak.countryCode);
  const hasCoords = peak.lat != null && peak.lon != null;
  const hasSaddle = peak.saddleLat != null && peak.saddleLon != null;
  const location = [peak.admin1, country].filter(Boolean).join(", ");

  const schema = {
    "@context": "https://schema.org",
    "@type": "Mountain",
    name: peak.name,
    ...(peak.elevation ? { elevation: `${peak.elevation} m` } : {}),
    ...(country ? { address: { "@type": "PostalAddress", addressCountry: country } } : {}),
    ...(hasCoords
      ? { geo: { "@type": "GeoCoordinates", latitude: peak.lat, longitude: peak.lon } }
      : {}),
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <main className="mx-auto max-w-4xl px-4 py-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Search peaks
        </Link>

        <header className="mt-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {peak.name}
          </h1>
          {location && (
            <p className="mt-2 flex items-center gap-2 text-muted-foreground">
              <Globe2 className="h-4 w-4" /> {location}
            </p>
          )}
        </header>

        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            icon={Mountain}
            label="Elevation"
            value={formatElevation(peak.elevation, units) ?? "—"}
          />
          <Stat
            icon={TrendingUp}
            label="Prominence"
            value={formatElevation(peak.prominence, units) ?? "—"}
          />
          <Stat icon={Globe2} label="Country" value={country ?? "—"} />
          <Stat
            icon={MapPin}
            label="Coordinates"
            value={hasCoords ? `${peak.lat!.toFixed(4)}, ${peak.lon!.toFixed(4)}` : "—"}
          />
          {peak.isolationKm != null && (
            <Stat
              icon={Ruler}
              label="Isolation"
              value={`${peak.isolationKm.toFixed(1)} km`}
            />
          )}
          {hasSaddle && (
            <Stat
              icon={Anchor}
              label="Key saddle"
              value={`${peak.saddleLat!.toFixed(3)}, ${peak.saddleLon!.toFixed(3)}`}
            />
          )}
        </section>

        {hasCoords && (
          <p className="mt-3 text-sm text-muted-foreground">
            {dms(peak.lat!, "N", "S")} · {dms(peak.lon!, "E", "W")}
          </p>
        )}

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Map preview
          </h2>
          {hasCoords ? (
            <>
              <LazyPeakMapPreview lat={peak.lat!} lng={peak.lon!} label={peak.name} />
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <a
                  className="text-primary hover:underline"
                  href={`https://www.openstreetmap.org/?mlat=${peak.lat}&mlon=${peak.lon}#map=13/${peak.lat}/${peak.lon}`}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Open in OpenStreetMap
                </a>
                <a
                  className="text-primary hover:underline"
                  href={`https://www.google.com/maps/search/?api=1&query=${peak.lat},${peak.lon}`}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Open in Google Maps
                </a>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">No coordinates recorded for this peak yet.</p>
          )}
        </section>

        <PeakAscentRegistry peakName={peak.name} ascents={ascents} />
      </main>
    </div>
  );
};

export default WorldPeakPage;
