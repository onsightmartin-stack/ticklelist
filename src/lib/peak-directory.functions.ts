import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export interface DirectoryPeak {
  id: number;
  name: string;
  elevation: number | null;
  prominence: number | null;
  countryCode: string | null;
}

export interface DirectoryCountry {
  code: string;
  peakCount: number;
  maxElevation: number | null;
}

const serverClient = () =>
  createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_SERVICE_ROLE_KEY"]!, {
    auth: { persistSession: false },
  });

const mapPeaks = (rows: Record<string, unknown>[] | null): DirectoryPeak[] =>
  (rows ?? []).map((r) => ({
    id: Number(r["id"]),
    name: String(r["name"]),
    elevation: r["elevation"] == null ? null : Number(r["elevation"]),
    prominence: r["prominence"] == null ? null : Number(r["prominence"]),
    countryCode: (r["country_code"] as string | null) ?? null,
  }));

/** Countries that have catalogued peaks, with counts (from a cached summary). */
export const getPeakCountries = createServerFn({ method: "GET" }).handler(
  async (): Promise<DirectoryCountry[]> => {
    const supabase = serverClient();
    const { data, error } = await supabase
      .from("world_peak_country_stats")
      .select("country_code, peak_count, max_elevation")
      .order("peak_count", { ascending: false })
      .limit(300);
    if (error || !data) return [];
    return (data as Record<string, unknown>[])
      .filter((r) => String(r["country_code"] ?? "").length === 2)
      .map((r) => ({
        code: String(r["country_code"]),
        peakCount: Number(r["peak_count"] ?? 0),
        maxElevation: r["max_elevation"] == null ? null : Number(r["max_elevation"]),
      }));
  },
);

/** Most prominent peaks worldwide. */
export const getTopPeaks = createServerFn({ method: "GET" })
  .inputValidator((input: { limit?: number } | undefined) => ({
    limit: Math.min(Math.max(Number(input?.limit ?? 100), 1), 300),
  }))
  .handler(async ({ data }): Promise<DirectoryPeak[]> => {
    const supabase = serverClient();
    const { data: rows } = await supabase
      .from("world_peaks")
      .select("id, name, elevation, prominence, country_code")
      .order("prominence", { ascending: false, nullsFirst: false })
      .limit(data.limit);
    return mapPeaks(rows as Record<string, unknown>[] | null);
  });

/** Most prominent peaks within one country. */
export const getCountryPeaks = createServerFn({ method: "GET" })
  .inputValidator((input: { code: string; limit?: number }) => {
    const code = String(input?.code ?? "")
      .trim()
      .toUpperCase();
    if (!/^[A-Z]{2}$/.test(code)) throw new Error("Invalid country code");
    return { code, limit: Math.min(Math.max(Number(input?.limit ?? 150), 1), 300) };
  })
  .handler(async ({ data }): Promise<DirectoryPeak[]> => {
    const supabase = serverClient();
    const { data: rows } = await supabase
      .from("world_peaks")
      .select("id, name, elevation, prominence, country_code")
      .eq("country_code", data.code)
      .order("prominence", { ascending: false, nullsFirst: false })
      .limit(data.limit);
    return mapPeaks(rows as Record<string, unknown>[] | null);
  });

/** Ids used to build the public peak sitemap. */
export const getSitemapPeaks = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ id: number }[]> => {
    const supabase = serverClient();
    const out: { id: number }[] = [];
    // PostgREST caps a response at 1000 rows, so page through the top peaks.
    for (let page = 0; page < 5; page++) {
      const { data } = await supabase
        .from("world_peaks")
        .select("id")
        .order("prominence", { ascending: false, nullsFirst: false })
        .range(page * 1000, page * 1000 + 999);
      const rows = (data as Record<string, unknown>[] | null) ?? [];
      out.push(...rows.map((r) => ({ id: Number(r["id"]) })));
      if (rows.length < 1000) break;
    }
    return out;
  },
);

