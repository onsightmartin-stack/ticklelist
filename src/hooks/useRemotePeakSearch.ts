import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { CatalogPeak } from "@/lib/peak-catalog";

export interface RemotePeakFilters {
  /** Minimum elevation in metres. */
  minElevation?: number | null;
  /** Minimum topographic prominence in metres. */
  minProminence?: number | null;
}

/**
 * Searches the ~980,000-peak global database (GeoNames summits, mountains,
 * hills and volcanoes) server-side, debounced. Complements the local catalog.
 */
export const useRemotePeakSearch = (
  query: string,
  limit = 8,
  filters: RemotePeakFilters = {},
): CatalogPeak[] => {
  const [rows, setRows] = useState<CatalogPeak[]>([]);
  const minElevation = filters.minElevation ?? null;
  const minProminence = filters.minProminence ?? null;

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setRows([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      const args: { _q: string; _limit: number; _min_elevation?: number; _min_prominence?: number } = {
        _q: q,
        _limit: limit,
      };
      if (minElevation) args._min_elevation = minElevation;
      if (minProminence) args._min_prominence = minProminence;
      const { data, error } = await supabase.rpc("search_world_peaks", args);
      if (cancelled || error || !data) return;
      setRows(
        (data as Array<Record<string, unknown>>).map((r) => {
          const elev = r["elevation"] as number | null;
          const prom = (r["prominence"] as number | null) ?? null;
          return {
            key: `wp:${String(r["id"])}`,
            name: String(r["name"]),
            elevation: elev ? `${elev} m` : "—",
            country: (r["country_code"] as string | null) ?? "",
            type: "famous_peak" as const,
            group: "World peaks",
            elevationM: elev ?? null,
            prominenceM: prom,
          };
        }),
      );
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, limit, minElevation, minProminence]);

  return rows;
};
