import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export interface WorldPeakDetail {
  id: number;
  name: string;
  elevation: number | null;
  prominence: number | null;
  lat: number | null;
  lon: number | null;
  countryCode: string | null;
  admin1: string | null;
  featureCode: string | null;
  saddleLat: number | null;
  saddleLon: number | null;
  isolationKm: number | null;
}

export interface PeakAscentEntry {
  id: string;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  ascentDate: string | null;
  datePrecision: string | null;
  route: string | null;
  tripReport: string | null;
  photoUrl: string | null;
}

const serverClient = () =>
  createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_SERVICE_ROLE_KEY"]!, {
    auth: { persistSession: false },
  });

/** Public read of a single catalog peak (`world_peaks` is publicly readable). */
export const getWorldPeak = createServerFn({ method: "GET" })
  .inputValidator((input: { id: number }) => {
    const id = Number(input?.id);
    if (!Number.isFinite(id) || id <= 0) throw new Error("Invalid peak id");
    return { id };
  })
  .handler(async ({ data }): Promise<WorldPeakDetail | null> => {
    const supabase = serverClient();

    const { data: row, error } = await supabase
      .from("world_peaks")
      .select(
        "id, name, elevation, prominence, lat, lon, country_code, admin1, feature_code, saddle_lat, saddle_lon, isolation_km",
      )
      .eq("id", data.id)
      .maybeSingle();

    if (error) throw new Error("Unable to load peak");
    if (!row) return null;

    const r = row as Record<string, unknown>;
    const num = (v: unknown) => (v == null ? null : Number(v));

    return {
      id: Number(r["id"]),
      name: String(r["name"]),
      elevation: num(r["elevation"]),
      prominence: num(r["prominence"]),
      lat: num(r["lat"]),
      lon: num(r["lon"]),
      countryCode: (r["country_code"] as string | null) ?? null,
      admin1: (r["admin1"] as string | null) ?? null,
      featureCode: (r["feature_code"] as string | null) ?? null,
      saddleLat: num(r["saddle_lat"]),
      saddleLon: num(r["saddle_lon"]),
      isolationKm: num(r["isolation_km"]),
    };
  });

/** Public community ascent registry for a peak, matched on the normalised name. */
export const getPeakAscents = createServerFn({ method: "GET" })
  .inputValidator((input: { name: string }) => {
    const name = String(input?.name ?? "").trim();
    if (!name) throw new Error("Missing peak name");
    return { name: name.slice(0, 120) };
  })
  .handler(async ({ data }): Promise<PeakAscentEntry[]> => {
    const supabase = serverClient();
    const { data: rows, error } = await supabase.rpc("peak_ascent_registry", {
      _name: data.name,
      _limit: 100,
    });
    if (error || !rows) return [];

    return (rows as Record<string, unknown>[]).map((r) => ({
      id: String(r["id"]),
      userId: String(r["user_id"]),
      displayName: (r["display_name"] as string | null) ?? null,
      avatarUrl: (r["avatar_url"] as string | null) ?? null,
      ascentDate: (r["ascent_date"] as string | null) ?? null,
      datePrecision: (r["date_precision"] as string | null) ?? null,
      route: (r["route"] as string | null) ?? null,
      tripReport: (r["trip_report"] as string | null) ?? null,
      photoUrl: (r["photo_url"] as string | null) ?? null,
    }));
  });
