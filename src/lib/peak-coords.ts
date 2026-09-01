import { supabase } from "@/integrations/supabase/client";

export interface PeakCoords {
  lat: number;
  lon: number;
  /** Where the coordinates came from — Peakbagger first, world catalogue second. */
  source: "peakbagger" | "catalog";
}

const cache = new Map<string, Promise<PeakCoords | null>>();

const key = (name: string) => name.trim().toLowerCase();

/** Google Maps deep link for a summit — exact pin when coordinates are known. */
export const googleMapsUrl = (
  coords: PeakCoords | null | undefined,
  name: string,
  country?: string | null,
) =>
  coords
    ? `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lon}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${name}${country ? ` ${country}` : ""} mountain`,
      )}`;

/**
 * Look up a summit's coordinates. Peakbagger is the source of record, so its
 * catalogue is checked first; the wider world-peak table is the fallback.
 */
export const lookupPeakCoords = (name: string | null | undefined): Promise<PeakCoords | null> => {
  const clean = (name ?? "").trim();
  if (!clean) return Promise.resolve(null);
  const k = key(clean);
  const hit = cache.get(k);
  if (hit) return hit;

  const promise = (async (): Promise<PeakCoords | null> => {
    const { data: pb } = await supabase
      .from("peakbagger_peaks")
      .select("lat, lon")
      .ilike("name", clean)
      .not("lat", "is", null)
      .limit(1)
      .maybeSingle();
    if (pb?.lat != null && pb.lon != null) {
      return { lat: pb.lat, lon: pb.lon, source: "peakbagger" };
    }

    const { data: wp } = await supabase
      .from("world_peaks")
      .select("lat, lon")
      .ilike("name", clean)
      .not("lat", "is", null)
      .order("prominence", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    if (wp?.lat != null && wp.lon != null) {
      return { lat: wp.lat, lon: wp.lon, source: "catalog" };
    }
    return null;
  })().catch(() => null);

  cache.set(k, promise);
  return promise;
};
