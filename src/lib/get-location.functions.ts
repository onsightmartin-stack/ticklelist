import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export interface LocationPointData {
  lat: number;
  lng: number;
  recorded_at: string;
}

export const getLocation = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createClient(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
    { auth: { persistSession: false } },
  );

  const { data, error } = await supabase
    .from("location_updates")
    .select("lat, lng, recorded_at")
    .order("recorded_at", { ascending: true });

  if (error) throw new Error("Unable to load location");

  const points: LocationPointData[] = (data ?? []).map((p) => ({
    lat: Number(p.lat),
    lng: Number(p.lng),
    recorded_at: String(p.recorded_at),
  }));

  return { points, current: points[points.length - 1] ?? null };
});
