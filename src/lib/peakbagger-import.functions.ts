import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { fetchPeakbagger } from "./peakbagger-fetch.server";


interface Row {
  peak: string;
  date: string;
  location?: string | undefined;
}

interface PeakbaggerImportInput {
  name?: string | undefined;
  cid?: string | undefined;
  fromYear?: number | undefined;
  toYear?: number | undefined;
}

export interface PeakbaggerImportResult {
  blocked?: boolean;
  reason?: string;
  cid?: string;
  climberName?: string;
  rows?: Row[];
  candidates?: Array<{ cid: string; name: string }>;
  error?: string;
}

const isChallenge = (html: string) =>
  html.includes("Just a moment") ||
  html.includes("cf-challenge") ||
  html.includes("Performing security verification");

const stripTags = (s: string) =>
  s
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

/** Goes through the Firecrawl proxy so Cloudflare doesn't block the import. */
const fetchPage = async (url: string) => {
  const page = await fetchPeakbagger(url);
  return { status: page.status, html: page.html || page.markdown };
};

/** Parse the climber's ascent table into rows. Peakbagger uses YYYY-MM-DD, sometimes YYYY-MM. */
const parseAscentList = (html: string): Row[] => {
  const rows: Row[] = [];
  for (const trMatch of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const tr = trMatch[1]!;
    if (!/peak\.aspx\?pid=/i.test(tr)) continue;

    const cells = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => stripTags(c[1]!));
    if (cells.length === 0) continue;

    const peakLink = tr.match(/peak\.aspx\?pid=\d+[^>]*>([^<]+)</i);
    const peak = peakLink ? stripTags(peakLink[1]!) : "";
    const dateRe = /(\d{4})-(\d{2})(?:-(\d{2}))?/;
    const dateCell = cells.find((c) => dateRe.test(c));
    const m = dateCell?.match(dateRe);
    const date = m ? `${m[1]}-${m[2]}-${m[3] ?? "01"}` : undefined;
    if (!peak || !date) continue;

    const location = cells.find(
      (c) => c !== peak && !/^\d[\d,.\s]*$/.test(c) && !dateRe.test(c) && c.length > 2,
    );
    rows.push({ peak, date, location });
  }
  return rows;

};

export const peakbaggerImport = createServerFn({ method: "POST" })
  .inputValidator((input: unknown): PeakbaggerImportInput => {
    const body = (input ?? {}) as Record<string, unknown>;
    return {
      name: typeof body["name"] === "string" ? body["name"] : undefined,
      cid: typeof body["cid"] === "string" ? body["cid"] : undefined,
      fromYear: Number.isFinite(Number(body["fromYear"])) && body["fromYear"] !== undefined && body["fromYear"] !== null && body["fromYear"] !== ""
        ? Number(body["fromYear"])
        : undefined,
      toYear: Number.isFinite(Number(body["toYear"])) && body["toYear"] !== undefined && body["toYear"] !== null && body["toYear"] !== ""
        ? Number(body["toYear"])
        : undefined,
    };
  })
  .handler(async ({ data }): Promise<PeakbaggerImportResult> => {
    try {
      // Require a signed-in member.
      const authHeader = getRequestHeader("Authorization") ?? "";
      const supabaseUrl = process.env["SUPABASE_URL"];
      const supabaseKey =
        process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
      if (!supabaseUrl || !supabaseKey) {
        console.error("peakbagger-import: missing Supabase server environment variables");
        return { error: "Backend is not configured. Try again in a moment." };
      }
      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false },
      });

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return { error: "Not authenticated" };

      const name = typeof data.name === "string" ? data.name.trim().slice(0, 120) : "";
      const cidInput = typeof data.cid === "string" ? data.cid.trim() : "";
      // Accept a climber id, a profile URL, or a bare number typed into the name field.
      const cid =
        cidInput.match(/cid=(\d+)/i)?.[1] ??
        cidInput.match(/\d+/)?.[0] ??
        name.match(/cid=(\d+)/i)?.[1] ??
        (/^\d+$/.test(name) ? name : "") ??
        "";

      if (!name && !cid) return { error: "Provide your Peakbagger climber id or profile link" };

      if (!cid) {
        // Peakbagger's climber search is behind a login/postback, so a plain name
        // cannot be resolved server-side. Ask for the id from the profile URL.
        return {
          error:
            "Peakbagger doesn't allow searching climbers by name from outside the site. Open your Peakbagger profile and paste the link (it ends with cid=12345) or just the number.",
        };
      }

      const climberId = cid;
      let climberName = name;

      // y=9999 = every year (without it Peakbagger can return only the current year).
      const { html } = await fetchPage(
        `https://peakbagger.com/climber/climblistc.aspx?cid=${climberId}&j=1&y=9999&u=ft&sort=ascentdate`,
      );
      if (isChallenge(html)) return { blocked: true, reason: "peakbagger_challenge", cid: climberId };


      if (!climberName || /^\d+$/.test(climberName)) {
        climberName = stripTags(html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "") || climberId;
      }

      let rows = parseAscentList(html);

      // Safety net: if the page came back scoped to a single year, walk every year
      // Peakbagger lists for this climber and merge the results.
      const years = new Set(rows.map((r) => r.date.slice(0, 4)));
      if (years.size <= 1) {
        const listed = new Set<string>();
        for (const m of html.matchAll(/[?&]y=((?:19|20)\d{2})\b/g)) listed.add(m[1]!);
        for (const m of html.matchAll(/<a name="(\d{2})"><\/a>\s*<\/?b?>?\s*((?:19|20)\d{2})/g))
          listed.add(m[2]!);
        const merged = new Map(rows.map((r) => [`${r.peak}|${r.date}`, r]));
        for (const y of listed) {
          const page = await fetchPage(
            `https://peakbagger.com/climber/climblistc.aspx?cid=${climberId}&j=1&y=${y}&u=ft&sort=ascentdate`,
          );
          if (isChallenge(page.html)) continue;
          for (const r of parseAscentList(page.html)) merged.set(`${r.peak}|${r.date}`, r);
        }
        rows = [...merged.values()].sort((a, b) => a.date.localeCompare(b.date));
      }

      // Optional year range filter.
      const from = data.fromYear;
      const to = data.toYear;
      if (from !== undefined || to !== undefined) {
        const lo = from ?? -Infinity;
        const hi = to ?? Infinity;
        rows = rows.filter((r) => {
          const y = Number(r.date.slice(0, 4));
          return y >= Math.min(lo, hi) && y <= Math.max(lo, hi);
        });
      }

      if (rows.length === 0) {
        const range =
          from !== undefined || to !== undefined
            ? ` between ${from ?? "any"} and ${to ?? "any"}`
            : "";
        return {
          error: `No ascents found for climber id ${climberId}${range}. Double-check the id on your Peakbagger profile.`,
        };
      }
      return { cid: climberId, climberName, rows };


    } catch (err) {
      console.error("peakbagger-import failed", err);
      return { error: err instanceof Error ? err.message : "Unexpected error" };
    }
  });
