import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DynamicPeak {
  id: number;
  name: string;
  lat: number | null;
  lon: number | null;
  countryCode: string | null;
  admin1: string | null;
  elevation: number | null;
  prominence: number | null;
}

export interface DynamicListQuery {
  country: string | null;
  minElevation: number | null;
  minProminence: number | null;
  sort: "elevation" | "prominence";
  limit: number;
}

export interface DynamicListResult {
  peaks: DynamicPeak[];
  total: number;
  loading: boolean;
  error: string | null;
}

/** Live list of catalogue peaks matching a member-built query. */
export const useDynamicPeakList = (query: DynamicListQuery, enabled = true): DynamicListResult => {
  const [peaks, setPeaks] = useState<DynamicPeak[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { country, minElevation, minProminence, sort, limit } = query;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const run = async () => {
      const args: {
        _sort: string;
        _limit: number;
        _country?: string;
        _min_elevation?: number;
        _min_prominence?: number;
      } = { _sort: sort, _limit: limit };
      if (country) args._country = country;
      if (minElevation) args._min_elevation = minElevation;
      if (minProminence) args._min_prominence = minProminence;
      const { data, error: err } = await supabase.rpc("build_peak_list", args);
      if (cancelled) return;
      if (err) {
        setError("Could not build that list — try narrowing the filters.");
        setPeaks([]);
        setTotal(0);
      } else {
        const rows = (data as Array<Record<string, unknown>>) ?? [];
        setPeaks(
          rows.map((r) => ({
            id: Number(r["id"]),
            name: String(r["name"]),
            lat: r["lat"] == null ? null : Number(r["lat"]),
            lon: r["lon"] == null ? null : Number(r["lon"]),
            countryCode: (r["country_code"] as string | null) ?? null,
            admin1: (r["admin1"] as string | null) ?? null,
            elevation: r["elevation"] == null ? null : Number(r["elevation"]),
            prominence: r["prominence"] == null ? null : Number(r["prominence"]),
          })),
        );
        setTotal(rows[0] ? Number(rows[0]["total_matches"]) : 0);
      }
      setLoading(false);
    };

    const t = setTimeout(run, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [country, minElevation, minProminence, sort, limit, enabled]);

  return { peaks, total, loading, error };
};

export interface PeakCountry {
  code: string;
  name: string;
  peaks: number;
}

const regionName = (code: string) => {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
};

/** Countries that have peaks in the catalogue, for the builder's country picker. */
export const usePeakCountries = (): PeakCountry[] => {
  const [rows, setRows] = useState<PeakCountry[]>([]);

  useEffect(() => {
    let cancelled = false;
    void supabase.rpc("world_peak_countries").then(({ data, error }) => {
      if (cancelled || error || !data) return;
      const list = (data as Array<Record<string, unknown>>).map((r) => {
        const code = String(r["country_code"]);
        return { code, name: regionName(code), peaks: Number(r["peaks"]) };
      });
      list.sort((a, b) => a.name.localeCompare(b.name));
      setRows(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return rows;
};
