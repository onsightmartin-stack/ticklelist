import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const clickInput = z.object({
  kind: z.string().min(1).max(40),
  url: z.string().url().max(600),
  videoId: z.string().max(40).nullish(),
  label: z.string().max(200).nullish(),
  pagePath: z.string().max(300).nullish(),
});

/** Records an outbound link click (YouTube links, support links, ...). */
export const logOutboundClick = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => clickInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("outbound_clicks").insert({
      kind: data.kind,
      url: data.url,
      video_id: data.videoId ?? null,
      label: data.label ?? null,
      page_path: data.pagePath ?? null,
    });
    if (error) console.error("[outbound-click]", error.message);
    return { ok: !error };
  });

/** Admin-only: raw click rows for the stats dashboard (RLS also enforces this). */
export const outboundClickRows = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("outbound_clicks")
      .select("kind, url, video_id, label, page_path, created_at")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw new Error(error.message);
    return { rows: data ?? [] };
  });
