import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { CatalogPlace } from "@/data/places";

const CATEGORY_LABEL: Record<string, string> = {
  castle: "Castle",
  museum: "Museum",
  monument: "Monument",
  religious: "Church, temple or shrine",
  palace: "Palace",
  archaeology: "Archaeological site",
  ruins: "Ruins",
  zoo: "Zoo",
  lighthouse: "Lighthouse",
  historic: "Historic site",
  theatre: "Theatre",
  square: "Square",
  natural: "Natural landmark",
  waterfall: "Waterfall",
  park: "Park or reserve",
  garden: "Garden",
  tower: "Tower",
  viewpoint: "Viewpoint",
  beach: "Beach",
  island: "Island",
  bridge: "Bridge",
};

/**
 * Searches the worldwide sightseeing catalogue (castles, museums, waterfalls,
 * temples, parks and more) server-side, debounced. Complements the curated list.
 */
export const useRemotePlaceSearch = (query: string, limit = 6): CatalogPlace[] => {
  const [rows, setRows] = useState<CatalogPlace[]>([]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setRows([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      const { data, error } = await supabase.rpc("search_world_places", { _q: q, _limit: limit });
      if (cancelled || error || !data) return;
      setRows(
        (data as Array<Record<string, unknown>>).map((r) => {
          const category = String(r["category"] ?? "sightseeing");
          const cc = (r["country_code"] as string | null) ?? null;
          return {
            key: `wpl:${String(r["id"])}`,
            name: String(r["name"]),
            country: cc,
            type: "landmark" as const,
            group: `${CATEGORY_LABEL[category] ?? "Sightseeing"}${cc ? ` · ${cc}` : ""}`,
          };
        }),
      );
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, limit]);

  return rows;
};
