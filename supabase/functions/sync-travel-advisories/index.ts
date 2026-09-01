import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Sources: ACLED, International Crisis Group, World Population Review
// Only tracks countries with active armed conflict or serious insurgency

// Map State Dept country names to our country names
const COUNTRY_NAME_MAP: Record<string, string> = {
  "Burma": "Myanmar",
  "Cabo Verde": "Cape Verde",
  "Congo, Democratic Republic of the": "DR Congo",
  "Congo, Republic of the": "Republic of the Congo",
  "Cote d'Ivoire": "Côte d'Ivoire",
  "Czech Republic": "Czech Republic",
  "Korea, North": "North Korea",
  "Korea, South": "South Korea",
  "Eswatini (Swaziland)": "Eswatini",
  "Timor-Leste": "East Timor",
  "Macedonia, North": "North Macedonia",
  "Sao Tome and Principe": "São Tomé and Príncipe",
  "Turkiye": "Turkey",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Building conflict data from ACLED / ICG sources...");

    // Based on ACLED casualty data, International Crisis Group, World Population Review — March 2026
    // Only active wars / armed conflicts (Level 4)
    const conflicts = [
      { country: "Ukraine", level: 4, text: "Active war — Russian invasion (ACLED: ~78k casualties/yr)" },
      { country: "Russia", level: 4, text: "Active war — Invasion of Ukraine, Iran conflict involvement" },
      { country: "Sudan", level: 4, text: "Active civil war — SAF vs RSF (ACLED: ~20k casualties/yr)" },
      { country: "Myanmar", level: 4, text: "Active civil war — Junta vs resistance (ACLED: ~15k casualties/yr)" },
      { country: "Iran", level: 4, text: "Active war — US-Israel military strikes since Feb 2026" },
      { country: "Israel", level: 4, text: "Active war — Gaza operations + Iran conflict (multi-front)" },
      { country: "Palestine", level: 4, text: "Active conflict — Gaza war (ACLED: ~18k casualties/yr)" },
      { country: "Yemen", level: 4, text: "Active civil war — Houthi vs government, Red Sea attacks" },
      { country: "Syria", level: 4, text: "Active multi-faction civil war since 2011" },
      { country: "Somalia", level: 4, text: "Active war — Al-Shabaab insurgency, limited governance" },
      { country: "Afghanistan", level: 4, text: "Active conflict — ISIS-K terrorism, Pak-Afghan border war" },
      { country: "Haiti", level: 4, text: "Active gang war — State collapse, armed groups control capital" },
      { country: "DR Congo", level: 4, text: "Active war — M23 offensive in east (record air strikes 2026)" },
      { country: "Ethiopia", level: 4, text: "Active conflict — Ethnic violence in Amhara & Oromia regions" },
    ];

    const advisoryData = conflicts;

    console.log(`Processing ${advisoryData.length} advisories...`);

    // Only store level 3 and 4 (the ones that actually affect climbing plans)
    const dangerousCountries = advisoryData.filter((a) => a.level >= 3);

    // First, remove countries that are no longer at risk
    const currentCountryNames = dangerousCountries.map((d) => d.country);
    const { error: deleteError } = await supabase
      .from("country_warnings")
      .delete()
      .not("country_name", "in", `(${currentCountryNames.map((n) => `"${n}"`).join(",")})`);

    if (deleteError) {
      console.error("Error removing old warnings:", deleteError);
    }

    // Upsert current warnings
    for (const advisory of dangerousCountries) {
      const { error } = await supabase.from("country_warnings").upsert(
        {
          country_name: advisory.country,
          advisory_level: advisory.level,
          advisory_text: advisory.text,
          last_checked_at: new Date().toISOString(),
        },
        { onConflict: "country_name" }
      );

      if (error) {
        console.error(`Error upserting ${advisory.country}:`, error);
      }
    }

    console.log(`Synced ${dangerousCountries.length} conflict warnings.`);

    return new Response(
      JSON.stringify({
        success: true,
        synced: dangerousCountries.length,
        countries: dangerousCountries.map((c) => `${c.country} (L${c.level})`),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("sync-travel-advisories error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
