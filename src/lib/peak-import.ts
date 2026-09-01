/**
 * Parsing helpers for the admin bulk peak importer.
 * Accepts CSV (with header row) or a JSON array of objects.
 */

export interface ImportPeak {
  name: string;
  elevation: number | null;
  prominence: number | null;
  lat: number | null;
  lon: number | null;
  country_code: string | null;
  admin1: string | null;
  feature_code: string;
}

export interface ParseResult {
  rows: ImportPeak[];
  errors: string[];
}

/** Header aliases → canonical field. */
const FIELD_ALIASES: Record<string, keyof ImportPeak> = {
  name: "name",
  peak: "name",
  peak_name: "name",
  title: "name",
  elevation: "elevation",
  elev: "elevation",
  height: "elevation",
  altitude: "elevation",
  metres: "elevation",
  meters: "elevation",
  prominence: "prominence",
  prom: "prominence",
  lat: "lat",
  latitude: "lat",
  lon: "lon",
  lng: "lon",
  long: "lon",
  longitude: "lon",
  country: "country_code",
  country_code: "country_code",
  cc: "country_code",
  iso: "country_code",
  region: "admin1",
  admin1: "admin1",
  state: "admin1",
  province: "admin1",
  county: "admin1",
  type: "feature_code",
  feature_code: "feature_code",
};

const normKey = (k: string) => k.trim().toLowerCase().replace(/\s+/g, "_");

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/[^\d.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
};

const str = (v: unknown): string | null => {
  const s = v === null || v === undefined ? "" : String(v).trim();
  return s === "" ? null : s;
};

/** Feature codes mirror GeoNames: PK peak, MT mountain, HLL hill, VLC volcano. */
const FEATURE_CODES = new Set(["PK", "MT", "HLL", "VLC", "PKS", "MTS", "RDGE"]);

const toPeak = (raw: Record<string, unknown>, index: number, errors: string[]): ImportPeak | null => {
  const mapped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    const field = FIELD_ALIASES[normKey(key)];
    if (field) mapped[field] = value;
  }

  const name = str(mapped["name"]);
  if (!name) {
    errors.push(`Row ${index + 1}: missing a peak name — skipped.`);
    return null;
  }
  if (name.length > 160) {
    errors.push(`Row ${index + 1}: name too long — skipped.`);
    return null;
  }

  const lat = num(mapped["lat"]);
  const lon = num(mapped["lon"]);
  if (lat !== null && (lat < -90 || lat > 90)) {
    errors.push(`Row ${index + 1} (${name}): latitude out of range — skipped.`);
    return null;
  }
  if (lon !== null && (lon < -180 || lon > 180)) {
    errors.push(`Row ${index + 1} (${name}): longitude out of range — skipped.`);
    return null;
  }

  const elevation = num(mapped["elevation"]);
  if (elevation !== null && (elevation < -500 || elevation > 9000)) {
    errors.push(`Row ${index + 1} (${name}): elevation ${elevation} m looks wrong — skipped.`);
    return null;
  }

  const cc = str(mapped["country_code"]);
  const code = (str(mapped["feature_code"]) ?? "PK").toUpperCase();

  const prominence = num(mapped["prominence"]);

  return {
    name,
    elevation: elevation === null ? null : Math.round(elevation),
    prominence:
      prominence === null || prominence < 0 || prominence > 9000
        ? null
        : Math.round(prominence),
    lat,
    lon,
    country_code: cc ? cc.slice(0, 2).toUpperCase() : null,
    admin1: str(mapped["admin1"])?.slice(0, 40) ?? null,
    feature_code: FEATURE_CODES.has(code) ? code : "PK",
  };
};

/** Minimal RFC4180-ish CSV splitter (handles quotes, commas, semicolons and tabs). */
export const splitCsv = (text: string): string[][] => {
  const delimiter = (() => {
    const head = text.split(/\r?\n/)[0] ?? "";
    const counts = [
      [",", (head.match(/,/g) ?? []).length],
      [";", (head.match(/;/g) ?? []).length],
      ["\t", (head.match(/\t/g) ?? []).length],
    ] as const;
    return [...counts].sort((a, b) => b[1] - a[1])[0]![0];
  })();

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]!;
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else quoted = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") cell += ch;
  }
  row.push(cell);
  rows.push(row);

  return rows.filter((r) => r.some((c) => c.trim() !== ""));
};

/** Parse pasted/uploaded text as JSON array or CSV into validated peak rows. */
export const parsePeakFile = (text: string): ParseResult => {
  const errors: string[] = [];
  const trimmed = text.trim();
  if (!trimmed) return { rows: [], errors: ["The file is empty."] };

  let records: Record<string, unknown>[] = [];

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      const list = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as { peaks?: unknown }).peaks)
          ? (parsed as { peaks: unknown[] }).peaks
          : [parsed];
      records = list.filter((r): r is Record<string, unknown> => !!r && typeof r === "object");
      if (records.length === 0) errors.push("No objects found in the JSON.");
    } catch {
      return { rows: [], errors: ["That JSON could not be parsed — check for a trailing comma."] };
    }
  } else {
    const table = splitCsv(trimmed);
    const header = table.shift();
    if (!header) return { rows: [], errors: ["No header row found."] };
    const known = header.filter((h) => FIELD_ALIASES[normKey(h)]);
    if (known.length === 0) {
      return {
        rows: [],
        errors: [
          "None of the CSV columns were recognised. Expected a header row with at least: name (plus optional elevation, lat, lon, country, region).",
        ],
      };
    }
    records = table.map((cells) => {
      const obj: Record<string, unknown> = {};
      header.forEach((h, i) => {
        obj[h] = cells[i] ?? "";
      });
      return obj;
    });
  }

  const rows: ImportPeak[] = [];
  const seen = new Set<string>();
  records.forEach((raw, i) => {
    const peak = toPeak(raw, i, errors);
    if (!peak) return;
    const key = `${peak.name.toLowerCase()}|${peak.country_code ?? ""}|${peak.elevation ?? ""}`;
    if (seen.has(key)) {
      errors.push(`Row ${i + 1} (${peak.name}): duplicate inside this file — skipped.`);
      return;
    }
    seen.add(key);
    rows.push(peak);
  });

  return { rows, errors };
};

export const SAMPLE_CSV = `name,elevation,lat,lon,country,region
Babia Góra,1725,49.5732,19.5296,PL,Lesser Poland
Rysy,2499,49.1794,20.0881,PL,Lesser Poland
Śnieżka,1603,50.7360,15.7397,PL,Lower Silesia`;
