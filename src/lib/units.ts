/**
 * Altitude units — metres everywhere except the handful of countries that
 * still think in feet. Elevations are stored as metres (numbers or strings
 * like "4,810 m"), so display is the only place that converts.
 */
export type UnitSystem = "metric" | "imperial";

/** Countries (and ISO codes) that use feet for altitude in daily life. */
const IMPERIAL = new Set([
  "us",
  "usa",
  "united states",
  "united states of america",
  "lr",
  "liberia",
  "mm",
  "myanmar",
  "burma",
]);

/** Pick units from a free-text country name or ISO code. */
export const unitsForCountry = (country?: string | null): UnitSystem | null => {
  if (!country) return null;
  return IMPERIAL.has(country.trim().toLowerCase()) ? "imperial" : "metric";
};

/** Pick units from a browser locale such as "en-US" or "en-GB". */
export const unitsForLocale = (locale?: string | null): UnitSystem => {
  const region = (locale ?? "").split(/[-_]/)[1]?.toUpperCase();
  if (!region) return "metric";
  return IMPERIAL.has(region.toLowerCase()) ? "imperial" : "metric";
};

/** Highest point on Earth — anything above it was stored as feet by mistake. */
const EVEREST_M = 8849;

/** Parse "8,848 m" / 8848 / "4810m" into metres, repairing feet mislabelled as metres. */
export const toMetres = (value: string | number | null | undefined): number | null => {
  if (value == null || value === "") return null;
  const raw =
    typeof value === "number"
      ? Number.isFinite(value)
        ? value
        : null
      : (() => {
          const m = value.replace(/[,\s]/g, "").match(/(-?\d+(?:\.\d+)?)/);
          return m ? Number(m[1]) : null;
        })();
  if (raw == null) return null;
  return raw > EVEREST_M ? Math.round(raw * 0.3048) : raw;
};

export const metresToFeet = (m: number) => Math.round(m * 3.280839895);

/**
 * Format an elevation for display in the member's units.
 * Returns null when there is nothing sensible to show.
 */
export const formatElevation = (
  value: string | number | null | undefined,
  units: UnitSystem = "metric",
): string | null => {
  const metres = toMetres(value);
  if (metres == null) return null;
  if (units === "imperial") return `${metresToFeet(metres).toLocaleString("en-US")} ft`;
  return `${Math.round(metres).toLocaleString("en-US")} m`;
};

/** Compact variant without a space, for very dense list rows. */
export const formatElevationShort = (
  value: string | number | null | undefined,
  units: UnitSystem = "metric",
): string | null => {
  const metres = toMetres(value);
  if (metres == null) return null;
  return units === "imperial"
    ? `${metresToFeet(metres).toLocaleString("en-US")}ft`
    : `${Math.round(metres).toLocaleString("en-US")}m`;
};
