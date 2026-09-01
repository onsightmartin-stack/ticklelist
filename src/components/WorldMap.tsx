import { memo, useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker,
} from "react-simple-maps";
import { Minus, Plus, RotateCcw, AlertTriangle, Triangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import PeakImage from "@/components/PeakImage";
import { countries, type ClimbStatus } from "@/data/countries";
import { peakDetails } from "@/data/peak-details";
import { formerHighpoints } from "@/data/former-highpoints";
import PeakDetailModal from "@/components/PeakDetailModal";
import { useCountryWarnings } from "@/hooks/useCountryWarnings";


const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const DEFAULT_CENTER: [number, number] = [10, 30];
const DEFAULT_ZOOM = 1;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

const SUMMITED_GREEN = "hsl(142 62% 42%)";
const VISITED_GREEN = "hsl(142 28% 30%)";
const ON_LIST_GRAY = "hsl(200 6% 22%)";

const NAME_MAP: Record<string, string> = {
  "USA": "United States of America",
  "Czech Republic": "Czechia",
  "Bosnia and Herzegovina": "Bosnia and Herz.",
  "East Timor": "Timor-Leste",
  "South Korea": "South Korea",
  "Taiwan": "Taiwan",
  "Cape Verde": "Cabo Verde",
  "DR Congo": "Dem. Rep. Congo",
  "Central African Republic": "Central African Rep.",
  "South Sudan": "S. Sudan",
  "Equatorial Guinea": "Eq. Guinea",
  "Eswatini": "eSwatini",
  "Côte d'Ivoire": "Côte d'Ivoire",
  "Dominican Republic": "Dominican Rep.",
  "Solomon Islands": "Solomon Is.",
  "Antigua and Barbuda": "Antigua and Barb.",
  "Saint Vincent and the Grenadines": "St. Vin. and Gren.",
  "Saint Kitts and Nevis": "St. Kitts and Nevis",
  "São Tomé and Príncipe": "São Tomé and Principe",
  "Marshall Islands": "Marshall Is.",
  "North Korea": "North Korea",
  "Republic of the Congo": "Congo",
  "North Macedonia": "Macedonia",
  "Vatican City": "Vatican",
  "UAE": "United Arab Emirates",
};

// Countries too small to be visible as landmasses at world zoom — drawn as markers instead.
const SMALL_COUNTRY_MARKERS: { country: string; coordinates: [number, number] }[] = [
  { country: "Cape Verde", coordinates: [-24.0, 15.1] },
];

const REVERSE_NAME_MAP: Record<string, string> = {};
for (const [key, val] of Object.entries(NAME_MAP)) {
  REVERSE_NAME_MAP[val] = key;
}

function findCountryKey(geoName: string): string | null {
  const countryKey = REVERSE_NAME_MAP[geoName] || geoName;
  const entry = countries.find((c) => c.country === countryKey);
  return entry ? entry.country : null;
}

function getFillColor(status: ClimbStatus | null): string {
  switch (status) {
    case "climbed":
      return SUMMITED_GREEN;
    case "mainland_climbed":
      return "hsl(var(--mainland))";
    case "legal_high_point":
      return "hsl(var(--legal))";
    case "visited":
      return VISITED_GREEN;
    case "not_visited":
      return ON_LIST_GRAY;
    default:
      return "hsl(var(--secondary))";
  }
}

function WorldMapInner() {
  const [tooltip, setTooltip] = useState<{
    name: string;
    status: ClimbStatus | null;
    peak?: string | undefined;
    photoUrl?: string | undefined;
    note?: string | undefined;
    warning?: { level: number; text: string } | null | undefined;
  } | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showMountains, setShowMountains] = useState(false);
  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
  });

  const { data: warnings = [] } = useCountryWarnings();
  const warningLookup = useMemo(
    () => new Map(warnings.map((w) => [w.country_name, w])),
    [warnings]
  );

  const countryLookup = useMemo(
    () => new Map(countries.map((country) => [country.country, country])),
    []
  );

  const highpointMarkers = useMemo(
    () =>
      countries
        .map((c) => {
          const detail = peakDetails[c.country];
          if (!detail?.coordinates) return null;
          return {
            country: c.country,
            coordinates: [detail.coordinates.lng, detail.coordinates.lat] as [number, number],
            status: c.status,
            peak: detail.peak,
          };
        })
        .filter((m): m is { country: string; coordinates: [number, number]; status: ClimbStatus; peak: string } => m !== null),
    []
  );



  const handleCountryClick = (geoName: string) => {
    const countryKey = findCountryKey(geoName);
    if (countryKey && peakDetails[countryKey]) {
      setSelectedCountry(countryKey);
      setModalOpen(true);
    }
  };

  const zoomIn = () => setPosition((prev) => ({ ...prev, zoom: Math.min(prev.zoom * 1.5, MAX_ZOOM) }));
  const zoomOut = () => setPosition((prev) => ({ ...prev, zoom: Math.max(prev.zoom / 1.5, MIN_ZOOM) }));
  const resetView = () => setPosition({ coordinates: DEFAULT_CENTER, zoom: DEFAULT_ZOOM });

  return (
    <div className="relative w-full">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-xs" style={{ background: SUMMITED_GREEN }} /> Summited</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-xs bg-legal" /> Legal HP</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-xs bg-mainland" /> Mainland HP Only</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-xs" style={{ background: VISITED_GREEN }} /> Country Visited</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-xs" style={{ background: ON_LIST_GRAY }} /> On List</span>
          <span className="flex items-center gap-1.5">
            <svg className="h-3 w-3 rounded-xs" viewBox="0 0 12 12"><defs><pattern id="legend-stripe" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)"><rect width="4" height="4" fill="white" /><line x1="0" y1="0" x2="0" y2="4" stroke="#1a1a1a" strokeWidth="2" /></pattern></defs><rect width="12" height="12" fill="url(#legend-stripe)" /></svg>
            Active Conflict
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="h-3 w-3 rounded-xs" viewBox="0 0 12 12"><defs><pattern id="legend-stripe-green" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)"><rect width="4" height="4" fill="hsl(142 62% 42%)" /><line x1="0" y1="0" x2="0" y2="4" stroke="#0d0d0d" strokeWidth="2" /></pattern></defs><rect width="12" height="12" fill="url(#legend-stripe-green)" /></svg>
            Conflict but summited
          </span>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant={showMountains ? "default" : "secondary"}
            size="sm"
            onClick={() => setShowMountains((prev) => !prev)}
            aria-label={showMountains ? "Hide mountain markers" : "Show mountain markers"}
            className="gap-1.5"
          >
            <Triangle className="h-4 w-4" />
            {showMountains ? "Hide peaks" : "Show peaks"}
          </Button>
          <Button type="button" variant="secondary" size="icon" onClick={zoomOut} aria-label="Zoom out map">
            <Minus className="h-4 w-4" />
          </Button>
          <Button type="button" variant="secondary" size="icon" onClick={zoomIn} aria-label="Zoom in map">
            <Plus className="h-4 w-4" />
          </Button>
          <Button type="button" variant="secondary" size="icon" onClick={resetView} aria-label="Reset map view">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {tooltip && (
        <div className="pointer-events-none absolute left-1/2 top-12 z-10 max-w-[220px] -translate-x-1/2 overflow-hidden rounded-sm border border-border bg-card text-sm shadow-lg">
          <PeakImage
            src={tooltip.photoUrl}
            alt={tooltip.peak ? `${tooltip.peak}, the highest mountain of ${tooltip.name}` : `High point of ${tooltip.name}`}
            className="h-20 w-full object-cover object-top"
            loading="lazy"
            width={1600}
            height={900}
          />
          <div className="px-3 py-2">
            <p className="font-display font-bold text-foreground">{tooltip.name}</p>
            {tooltip.warning && (
              <p className="text-xs font-semibold text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {tooltip.warning.text}
              </p>
            )}
            {tooltip.status && (
              <p className="text-xs text-muted-foreground">
                {tooltip.status === "climbed"
                  ? `✓ Summited${tooltip.peak ? ` — ${tooltip.peak}` : ""}`
                  : tooltip.status === "legal_high_point"
                  ? `⬡ Legal HP${tooltip.peak ? ` — ${tooltip.peak}` : ""}`
                  : tooltip.status === "mainland_climbed"
                  ? `◈ Mainland HP${tooltip.peak ? ` — ${tooltip.peak}` : ""}`
                  : tooltip.status === "visited"
                  ? `◉ Visited${tooltip.peak ? ` — ${tooltip.peak}` : ""}`
                  : `○ Not yet climbed${tooltip.peak ? ` — ${tooltip.peak}` : ""}`}
              </p>
            )}
            {tooltip.note && <p className="mt-0.5 text-xs text-mainland">{tooltip.note}</p>}
            {tooltip.status && <p className="mt-1 text-xs italic text-muted-foreground">Tap for details</p>}
          </div>
        </div>
      )}

      <div className="w-full overflow-hidden rounded-sm border border-border" style={{ height: "clamp(250px, 40vw, 520px)", background: "hsl(201 66% 43%)" }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 120, center: DEFAULT_CENTER }}
          width={800}
          height={400}
          style={{ width: "100%", height: "100%" }}
        >
          <defs>
            <pattern id="stripe-high" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="hsl(0 0% 100%)" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="hsl(0 0% 10%)" strokeWidth="3" />
            </pattern>
            <pattern id="stripe-green" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="hsl(142 62% 42%)" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="hsl(0 0% 5%)" strokeWidth="3" />
            </pattern>
          </defs>
          <ZoomableGroup
            center={position.coordinates}
            zoom={position.zoom}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            onMoveEnd={(nextPosition) => setPosition(nextPosition)}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const geoName = geo.properties.name;
                  const countryKey = findCountryKey(geoName);
                  const entry = countryKey ? countryLookup.get(countryKey) ?? null : null;
                  const detail = countryKey ? peakDetails[countryKey] : null;
                  const status = entry?.status ?? null;
                  const hasDetail = Boolean(detail);
                  const warning = countryKey ? warningLookup.get(countryKey) : null;
                  const isHighRisk = warning && warning.advisory_level >= 4;
                  const isConflictSummited = isHighRisk && (status === "climbed" || status === "legal_high_point" || status === "mainland_climbed");
                  const showStripes = isHighRisk && countryKey !== "Russia" && !isConflictSummited;

                  const fillColor = isConflictSummited ? "url(#stripe-green)" : showStripes ? "url(#stripe-high)" : getFillColor(status);

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fillColor}
                      stroke={showStripes || isConflictSummited ? "hsl(0 0% 30%)" : "hsl(var(--border))"}
                      strokeWidth={showStripes || isConflictSummited ? 1.2 : 0.5}
                      onClick={() => handleCountryClick(geoName)}
                      onMouseEnter={() => {
                        setTooltip({
                          name: geoName,
                          status,
                          peak: entry?.highPoint,
                          photoUrl: detail?.photoUrl,
                          note: entry?.note,
                          warning: warning
                            ? { level: warning.advisory_level, text: warning.advisory_text || `Level ${warning.advisory_level}` }
                            : null,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        default: { outline: "none" },
                        hover: {
                          outline: "none",
                          fill: isConflictSummited
                            ? "url(#stripe-green)"
                            : showStripes
                            ? "url(#stripe-high)"
                            : status === "climbed"
                            ? "hsl(142 62% 42% / 0.7)"
                            : status === "legal_high_point"
                            ? "hsl(var(--legal) / 0.7)"
                            : status === "mainland_climbed"
                            ? "hsl(var(--mainland) / 0.7)"
                            : status === "visited"
                            ? "hsl(142 28% 30% / 0.7)"
                            : "hsl(200 6% 22% / 0.3)",
                          cursor: hasDetail ? "pointer" : "default",
                          opacity: showStripes || isConflictSummited ? 0.8 : 1,
                        },
                        pressed: { outline: "none" },
                      }}
                    />
                  );
                })
              }
            </Geographies>

            {SMALL_COUNTRY_MARKERS.map(({ country, coordinates }) => {
              const entry = countryLookup.get(country) ?? null;
              const detail = peakDetails[country];
              const status = entry?.status ?? null;
              const r = 4.5 / position.zoom;

              return (
                <Marker
                  key={country}
                  coordinates={coordinates}
                  onClick={() => {
                    if (detail) {
                      setSelectedCountry(country);
                      setModalOpen(true);
                    }
                  }}
                  onMouseEnter={() =>
                    setTooltip({
                      name: country,
                      status,
                      peak: entry?.highPoint,
                      photoUrl: detail?.photoUrl,
                      note: entry?.note,
                      warning: null,
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                  style={{ default: { outline: "none" }, hover: { outline: "none" }, pressed: { outline: "none" } }}
                >
                  <circle
                    r={r}
                    fill={getFillColor(status)}
                    stroke="hsl(0 0% 100%)"
                    strokeWidth={1.2 / position.zoom}
                    style={{ cursor: detail ? "pointer" : "default" }}
                  />
                </Marker>
              );
            })}

            {/* Highpoint location triangles — one per country highpoint */}
            {showMountains && highpointMarkers.map(({ country, coordinates, status, peak }) => {
              const s = 2.6 / position.zoom;
              const entry = countryLookup.get(country) ?? null;
              const detail = peakDetails[country];
              return (
                <Marker
                  key={`hp-${country}`}
                  coordinates={coordinates}
                  onClick={() => {
                    if (detail) {
                      setSelectedCountry(country);
                      setModalOpen(true);
                    }
                  }}
                  onMouseEnter={() =>
                    setTooltip({
                      name: country,
                      status,
                      peak,
                      photoUrl: detail?.photoUrl,
                      note: entry?.note,
                      warning: null,
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                  style={{ default: { outline: "none" }, hover: { outline: "none" }, pressed: { outline: "none" } }}
                >
                  <polygon
                    points={`0,${-s} ${s * 0.9},${s * 0.7} ${-s * 0.9},${s * 0.7}`}
                    fill={getFillColor(status)}
                    stroke="hsl(0 0% 100%)"
                    strokeWidth={0.9 / position.zoom}
                    style={{ cursor: detail ? "pointer" : "default" }}
                  />
                </Marker>
              );
            })}

            {/* Former / disputed highpoints */}
            {showMountains && formerHighpoints.map((fp) => {
              const s = 2.6 / position.zoom;
              return (
                <Marker
                  key={`former-${fp.peak}`}
                  coordinates={[fp.coordinates.lng, fp.coordinates.lat]}
                  onMouseEnter={() =>
                    setTooltip({
                      name: `${fp.peak} — ${fp.country}`,
                      status: null,
                      peak: `${fp.elevation.toLocaleString()} m`,
                      note: fp.note,
                      warning: null,
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                  style={{ default: { outline: "none" }, hover: { outline: "none" }, pressed: { outline: "none" } }}
                >
                  <polygon
                    points={`0,${-s} ${s * 0.9},${s * 0.7} ${-s * 0.9},${s * 0.7}`}
                    fill="hsl(280 70% 60%)"
                    stroke="hsl(0 0% 100%)"
                    strokeWidth={0.9 / position.zoom}
                  />
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {showMountains && (
      <div className="mt-3 rounded-sm border border-border bg-card/50 p-3 text-xs text-muted-foreground">
        <p className="mb-2 font-semibold text-foreground">Triangles mark the location of each country highpoint</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          <span className="flex items-center gap-1.5"><Triangle className="h-3 w-3" style={{ fill: SUMMITED_GREEN, color: SUMMITED_GREEN }} /> Summited</span>
          <span className="flex items-center gap-1.5"><Triangle className="h-3 w-3 fill-legal text-legal" /> Legal high point</span>
          <span className="flex items-center gap-1.5"><Triangle className="h-3 w-3 fill-mainland text-mainland" /> Mainland HP only</span>
          <span className="flex items-center gap-1.5"><Triangle className="h-3 w-3" style={{ fill: VISITED_GREEN, color: VISITED_GREEN }} /> Country visited</span>
          <span className="flex items-center gap-1.5"><Triangle className="h-3 w-3" style={{ fill: ON_LIST_GRAY, color: ON_LIST_GRAY }} /> Not yet climbed</span>
          <span className="flex items-center gap-1.5"><Triangle className="h-3 w-3" style={{ fill: "hsl(280 70% 60%)", color: "hsl(280 70% 60%)" }} /> Former / disputed highpoint</span>
        </div>
        <p className="mt-2">
          Violet triangles are peaks often listed as a country's highpoint that aren't the true summit — Midžor (Serbia excluding
          Kosovo, the real highpoint being Rudoka e Madhe), Bobotov Kuk (superseded by Zla Kolata in Montenegro), Khazret Sultan
          (superseded by Alpomish in Uzbekistan) and Kebnekaise Sydtoppen (lower than Nordtoppen since 2019).
        </p>
      </div>
      )}

      <PeakDetailModal country={selectedCountry} open={modalOpen} onOpenChange={setModalOpen} />
    </div>

  );
}

const WorldMap = memo(WorldMapInner);

export default WorldMap;
