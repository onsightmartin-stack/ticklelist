import { fuzzyFieldScore } from "@/lib/fuzzy";
import { countries } from "@/data/countries";
import { famousPeaks } from "@/data/famous-peaks";
import { countsAsCountryHighpoint, historicHighpoints } from "@/lib/historic-highpoints";

export type PeakType = "country_highpoint" | "famous_peak";

export interface CatalogPeak {
  key: string;
  name: string;
  elevation: string;
  country: string;
  type: PeakType;
  group: string;
  /** Numeric elevation in metres, when known. */
  elevationM?: number | null;
  /** Topographic prominence in metres, when known. */
  prominenceM?: number | null;
  /** Alternative names for the same summit (native / English / Peakbagger). */
  altNames?: string[];
}

/** Parse "8,848 m" / "4810m" style strings into metres. */
export const parseElevationM = (value: string | undefined | null): number | null => {
  if (!value) return null;
  const m = value.replace(/[,\s]/g, "").match(/(\d+)/);
  return m ? Number(m[1]) : null;
};

/** Country high points — one entry per country (shared summits appear per country). */
const highPointEntries: CatalogPeak[] = countries.map((c) => ({
  key: `hp:${c.country}`,
  name: c.highPoint,
  elevation: c.elevation,
  country: c.country,
  type: "country_highpoint" as const,
  group: `Country high points · ${c.continent}`,
  ...(c.altNames?.length ? { altNames: c.altNames } : {}),
}));

/**
 * Historic high points — loggable as a country high point, but only credited
 * as such for ascents on or before the date they lost the title.
 */
const historicEntries: CatalogPeak[] = historicHighpoints.map((h) => ({
  key: `hhp:${h.country}:${h.peak}`,
  name: h.peak,
  elevation: h.elevation,
  country: h.country,
  type: "country_highpoint" as const,
  group: `Historic high points · highest of ${h.country} until ${h.heldUntil}`,
  elevationM: h.elevationM,
  altNames: [h.peak, ...h.aliases],
}));

const famousEntries: CatalogPeak[] = famousPeaks.map((p) => ({
  key: `fp:${p.name}`,
  name: p.name,
  elevation: p.elevation,
  country: p.country,
  type: "famous_peak" as const,
  group: `Famous peaks · ${p.group}`,
}));

/**
 * Loggable peaks — country high points + curated famous peaks, plus ~6,000
 * world peaks lazily merged in from `world-peaks.json` (see loadWorldPeaks).
 */
export const peakCatalog: CatalogPeak[] = [...highPointEntries, ...historicEntries, ...famousEntries];

export const findPeak = (key: string) => peakCatalog.find((p) => p.key === key);

/** Coordinates for lazily-loaded world peaks, keyed by catalog key. */
export const worldPeakCoords = new Map<string, { lat: number; lng: number }>();

type WorldPeakRow = [string, number, number, string, number | null, number | null];

let worldPeaksPromise: Promise<void> | null = null;
let worldPeaksReady = false;
const readyListeners = new Set<() => void>();

export const worldPeaksLoaded = () => worldPeaksReady;

export const onWorldPeaksLoaded = (fn: () => void) => {
  readyListeners.add(fn);
  return () => {
    readyListeners.delete(fn);
  };
};

/**
 * Merge the big world-peak dataset into the catalog on demand, so the initial
 * bundle stays small but search covers far more than country high points.
 */
export const loadWorldPeaks = (): Promise<void> => {
  if (worldPeaksPromise) return worldPeaksPromise;
  worldPeaksPromise = import("@/data/world-peaks.json")
    .then((mod) => {
      const rows = (mod.default ?? mod) as unknown as WorldPeakRow[];
      const known = new Set(peakCatalog.map((p) => p.name.toLowerCase()));
      for (const [name, el, prom, country, lat, lng] of rows) {
        const lower = name.toLowerCase();
        if (known.has(lower)) continue;
        known.add(lower);
        const key = `wp:${name}`;
        peakCatalog.push({
          key,
          name,
          elevation: `${el.toLocaleString("en-US")} m`,
          country: country || "—",
          type: "famous_peak",
          group: `World peaks · ${country || "Other"}${prom >= 1500 ? " (ultra)" : ""}`,
        });
        if (lat != null && lng != null) worldPeakCoords.set(key, { lat, lng });
      }
      worldPeaksReady = true;
      readyListeners.forEach((fn) => fn());
    })
    .catch(() => {
      worldPeaksPromise = null;
    });
  return worldPeaksPromise;
};




/**
 * Typo-tolerant peak search built on the shared site-wide fuzzy matcher.
 * Name matches always outrank country matches.
 */
export const searchPeaks = (query: string, limit = 60): CatalogPeak[] => {
  const q = query.trim();
  if (!q) return peakCatalog.slice(0, limit);

  const scored: { peak: CatalogPeak; score: number }[] = [];
  for (const p of peakCatalog) {
    const score = Math.min(
      fuzzyFieldScore(q, p.name),
      ...(p.altNames ?? []).map((n) => fuzzyFieldScore(q, n) + 0.1),
      fuzzyFieldScore(q, p.country) + 0.5,
    );
    if (Number.isFinite(score)) scored.push({ peak: p, score });
  }

  return scored
    .sort(
      (a, b) =>
        a.score - b.score ||
        a.peak.name.length - b.peak.name.length ||
        a.peak.name.localeCompare(b.peak.name),
    )
    .slice(0, limit)
    .map((s) => s.peak);
};


/** How exact the logged date is — some old ascents only have a year or month. */
export type DatePrecision = "day" | "month" | "year";

export interface Ascent {
  id: string;
  user_id: string;
  peak_name: string;
  peak_type: PeakType;
  country: string | null;
  elevation: string | null;
  ascent_date: string;
  date_precision?: DatePrecision | null;
  route: string | null;
  trip_report: string | null;
  photo_url: string | null;
  is_public: boolean;
  created_at: string;
  /** Ticklelist members climbed with. */
  partner_ids?: string[] | null;
  /** Free-text co-climbers who aren't members. */
  partner_names?: string[] | null;
  /** Climbed as part of a group / organised party. */
  with_group?: boolean | null;
  /** 3000 m+ style: self-guided or with a guide. */
  guiding?: "self_guided" | "guided" | null;
  /** High-altitude style: with or without supplemental oxygen. */
  oxygen?: "no_oxygen" | "oxygen" | null;
}

export const formatAscentDate = (d: string, precision: DatePrecision | null = "day") => {
  const date = new Date(d + "T00:00:00");
  if (precision === "year") return String(date.getFullYear());
  if (precision === "month")
    return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};


export interface LeaderboardRow {
  userId: string;
  highPoints: number;
  famous: number;
  total: number;
}

/** Rank members by distinct country high points, then famous peaks. */
export const buildLeaderboard = (ascents: Ascent[]): LeaderboardRow[] => {
  const byUser = new Map<string, { hp: Set<string>; fp: Set<string> }>();
  for (const a of ascents) {
    if (!byUser.has(a.user_id)) byUser.set(a.user_id, { hp: new Set(), fp: new Set() });
    const entry = byUser.get(a.user_id)!;
    if (countsAsCountryHighpoint(a)) entry.hp.add(a.country ?? a.peak_name);
    else entry.fp.add(a.peak_name);
  }
  return [...byUser.entries()]
    .map(([userId, v]) => ({
      userId,
      highPoints: v.hp.size,
      famous: v.fp.size,
      total: v.hp.size + v.fp.size,
    }))
    .sort((a, b) => b.highPoints - a.highPoints || b.famous - a.famous);
};
