import { createServerFn } from "@tanstack/react-start";

export const visitorCount = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data, error } = await supabaseAdmin.rpc("increment_visitor_count");
  if (error) {
    console.error("[visitor-count]", error.message);
    throw new Error("Unable to update counter");
  }

  return { count: data as number };
});

/** Read the counter without incrementing it (repeat views in the same session). */
export const readVisitorCount = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data, error } = await supabaseAdmin
    .from("visitor_counter")
    .select("count")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("[visitor-count:read]", error.message);
    throw new Error("Unable to read counter");
  }

  return { count: (data?.count as number | undefined) ?? null };
});
