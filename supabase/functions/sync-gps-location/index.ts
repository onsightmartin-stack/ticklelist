import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PAJ_API_URL =
  "https://connect.paj-gps.de/api/v1/deviceViewMode?viewcheck=8fcfb5209c0dd141d744ec865456a05e41effd5d&iddevice=1011330527";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch latest position from PAJ GPS API
    const response = await fetch(PAJ_API_URL);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`PAJ API error [${response.status}]: ${text}`);
    }

    const json = await response.json();
    const lastPoint = json?.success?.device?.lastPoint;

    if (!lastPoint || !lastPoint.lat || !lastPoint.lng) {
      throw new Error("No valid location data from PAJ GPS API");
    }

    const lat = lastPoint.lat;
    const lng = lastPoint.lng;
    const recordedAt = new Date(lastPoint.dateunix * 1000).toISOString();

    // Check if we already have this exact timestamp to avoid duplicates
    const { data: existing } = await supabase
      .from("location_updates")
      .select("id")
      .eq("recorded_at", recordedAt)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ message: "Location already recorded", lat, lng, recorded_at: recordedAt }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Insert new location
    const { error: insertError } = await supabase
      .from("location_updates")
      .insert({ lat, lng, recorded_at: recordedAt });

    if (insertError) {
      throw new Error(`Insert error: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({ message: "Location synced", lat, lng, recorded_at: recordedAt }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("GPS sync error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
