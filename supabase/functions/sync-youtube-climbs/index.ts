import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const YOUTUBE_CHANNEL_ID = "UCwTTwmAr_X7zUXdbWIBbBPw"; // @onsightmartin
const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3";
const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    if (!YOUTUBE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "YOUTUBE_API_KEY is not configured. Add it in project secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch latest videos from the channel
    const searchUrl = `${YOUTUBE_API_URL}/search?part=snippet&channelId=${YOUTUBE_CHANNEL_ID}&order=date&maxResults=15&type=video&key=${YOUTUBE_API_KEY}`;
    const ytResponse = await fetch(searchUrl);

    if (!ytResponse.ok) {
      const errorText = await ytResponse.text();
      console.error("YouTube API error:", ytResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `YouTube API error: ${ytResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ytData = await ytResponse.json();
    const videos = ytData.items || [];
    console.log(`YouTube API returned ${videos.length} videos for channel ${YOUTUBE_CHANNEL_ID}`);

    // Check which videos we already have
    const videoIds = videos.map((v: any) => v.id.videoId).filter(Boolean);
    console.log(`Video IDs: ${JSON.stringify(videoIds)}`);
    
    const { data: existing, error: existErr } = await supabase
      .from("youtube_climbs")
      .select("video_id")
      .in("video_id", videoIds);

    console.log(`Existing in DB: ${existing?.length || 0}, error: ${existErr?.message || 'none'}`);
    const existingIds = new Set((existing || []).map((e: any) => e.video_id));
    const newVideos = videos.filter((v: any) => v.id.videoId && !existingIds.has(v.id.videoId));
    console.log(`New videos to process: ${newVideos.length}`);

    if (newVideos.length === 0) {
      return new Response(
        JSON.stringify({ message: "No new videos found.", synced: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use AI to analyze each new video for climb data
    const results = [];

    for (const video of newVideos) {
      const snippet = video.snippet;
      const videoId = video.id.videoId;

      const aiPrompt = `Analyze this YouTube video from a mountain climber who is climbing the highest point of every country in the world.

Title: "${snippet.title}"
Description: "${snippet.description}"
Published: ${snippet.publishedAt}

Does this video document a specific country highpoint climb? If yes, extract:
- peak_name: The name of the peak/mountain
- country: The country it's the highpoint of
- continent: Which continent
- elevation: Elevation if mentioned (e.g. "4,807 m")
- climb_date: When the climb happened (YYYY-MM format if possible)

If this video is NOT about a specific country highpoint climb (e.g. it's a gear review, travel vlog without a summit, Q&A, etc.), set is_climb to false.

Respond with a JSON object using this exact structure:
{"is_climb": true/false, "peak_name": "...", "country": "...", "continent": "...", "elevation": "...", "climb_date": "..."}`;

      try {
        const aiResponse = await fetch(AI_GATEWAY_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: "You are a data extraction assistant. Always respond with valid JSON only, no markdown fences." },
              { role: "user", content: aiPrompt },
            ],
          }),
        });

        if (!aiResponse.ok) {
          console.error(`AI error for ${videoId}:`, aiResponse.status);
          continue;
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || "";
        
        // Parse AI response
        let parsed;
        try {
          // Strip potential markdown fences
          const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          parsed = JSON.parse(cleaned);
        } catch {
          console.error(`Failed to parse AI response for ${videoId}:`, content);
          continue;
        }

        const thumbnail = snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url;

        const record = {
          video_id: videoId,
          video_title: snippet.title,
          video_description: snippet.description,
          video_url: `https://www.youtube.com/watch?v=${videoId}`,
          thumbnail_url: thumbnail,
          published_at: snippet.publishedAt,
          peak_name: parsed.is_climb ? parsed.peak_name : null,
          country: parsed.is_climb ? parsed.country : null,
          continent: parsed.is_climb ? parsed.continent : null,
          elevation: parsed.is_climb ? parsed.elevation : null,
          climb_date: parsed.is_climb ? parsed.climb_date : null,
          status: parsed.is_climb ? "pending" : "rejected",
        };

        const { error: insertError } = await supabase
          .from("youtube_climbs")
          .insert(record);

        if (insertError) {
          console.error(`Insert error for ${videoId}:`, insertError);
        } else {
          results.push(record);
        }
      } catch (aiErr) {
        console.error(`Error processing ${videoId}:`, aiErr);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Synced ${results.length} new videos.`,
        synced: results.length,
        climbs_detected: results.filter((r) => r.status === "pending").length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("sync error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
