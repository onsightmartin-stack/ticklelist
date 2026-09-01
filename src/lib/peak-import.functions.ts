import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ImportPeak } from "@/lib/peak-import";

interface ImportInput {
  peaks: ImportPeak[];
  /** Free-text label stored on each row, e.g. "polish-counties.csv". */
  source: string;
}

export interface ImportPeaksResult {
  inserted: number;
  skipped: number;
  messages: string[];
}

/** Admins only: bulk-insert peaks into the global catalog (`world_peaks`). */
export const importPeaks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ImportInput) => {
    if (!input || !Array.isArray(input.peaks)) throw new Error("No peaks supplied");
    if (input.peaks.length === 0) throw new Error("No peaks supplied");
    if (input.peaks.length > 5000) throw new Error("Import up to 5,000 peaks at a time");
    return input;
  })
  .handler(async ({ data, context }): Promise<ImportPeaksResult> => {
    const { supabase, userId } = context;

    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleError) throw new Error(roleError.message);
    if (!isAdmin) throw new Error("Forbidden");

    const source = `import:${(data.source || "manual").slice(0, 60)}`;
    const messages: string[] = [];
    let inserted = 0;
    let skipped = 0;

    // Chunked so a single bad row can't fail the whole upload.
    const CHUNK = 200;
    for (let i = 0; i < data.peaks.length; i += CHUNK) {
      const chunk = data.peaks.slice(i, i + CHUNK).map((p) => ({ ...p, source, added_by: userId }));
      const { data: rows, error } = await supabase
        .from("world_peaks")
        .insert(chunk)
        .select("id");

      if (!error) {
        inserted += rows?.length ?? chunk.length;
        continue;
      }

      // Retry row by row so duplicates are reported instead of losing the batch.
      for (const row of chunk) {
        const { error: rowError } = await supabase.from("world_peaks").insert(row);
        if (!rowError) {
          inserted += 1;
        } else {
          skipped += 1;
          if (messages.length < 25) {
            messages.push(
              rowError.code === "23505"
                ? `${row.name}: already in the catalog — skipped.`
                : `${row.name}: ${rowError.message}`,
            );
          }
        }
      }
    }

    return { inserted, skipped, messages };
  });
