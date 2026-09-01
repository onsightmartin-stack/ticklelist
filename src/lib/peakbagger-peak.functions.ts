import { createServerFn } from "@tanstack/react-start";
import { fetchPeakbagger, searchPeakbaggerPid } from "./peakbagger-fetch.server";

export interface PeakbaggerPeakInfo {
  found: boolean;
  blocked?: boolean;
  error?: string;
  pid?: string;
  name?: string | undefined;
  elevation?: number | null;
  prominence?: number | null;
  lat?: number | null;
  lon?: number | null;
  countryCode?: string | null;
  admin1?: string | null;
  firstAscentDate?: string | null;
  firstAscentBy?: string | null;
  url?: string;
}

const stripTags = (s: string) =>
  s
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

/** All Peakbagger traffic goes through the proxy in peakbagger-fetch.server. */
const fetchPage = async (url: string) => {
  const page = await fetchPeakbagger(url);
  return {
    status: page.status,
    html: page.markdown || page.html,
    blocked: page.blocked,
  };
};

const num = (v: string | undefined): number | null => {
  if (!v) return null;
  const n = Number(v.replace(/[,\s]/g, ""));
  return Number.isFinite(n) ? n : null;
};

/** Peakbagger prints "Elevation: 20,310 feet, 6190.5 meters" — keep metres. */
const metres = (text: string, label: string): number | null => {
  const at = text.search(new RegExp(label, "i"));
  if (at < 0) return null;
  const window = text.slice(at, at + 140);
  const m = window.match(/(-?[\d,]+(?:\.\d+)?)\s*(?:meters?|metres?|m\b)/i);
  if (m) return num(m[1]);
  const ft = window.match(/(-?[\d,]+(?:\.\d+)?)\s*(?:feet|ft)\b/i);
  const f = num(ft?.[1]);
  return f === null ? null : Math.round(f * 0.3048);
};

const parsePeakPage = (html: string, pid: string): PeakbaggerPeakInfo => {
  const text = stripTags(html);
  const nameMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const name = nameMatch ? stripTags(nameMatch[1]!) : undefined;

  const coords = text.match(/(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/);
  const country =
    text.match(/(?:Nation|Country)[:|\s]+([A-Za-z .'-]{3,40})/i)?.[1]?.trim() ?? null;
  const state =
    text
      .match(/(?:State\/Province|State|Province|Region)[:|\s]+([A-Za-z .'-]{2,40})/i)?.[1]
      ?.trim() ?? null;

  const faBlock = text.match(/First Ascent[^A-Za-z0-9]{0,5}([^|]{0,120})/i)?.[1] ?? "";
  const faYear = faBlock.match(/\b(1[0-9]{3}|20[0-9]{2})\b/)?.[1] ?? null;
  const faDate = faBlock.match(/(\d{4}-\d{2}-\d{2})/)?.[1] ?? faYear;
  const faBy =
    faBlock
      .replace(/(\d{4}-\d{2}-\d{2})|\b(1[0-9]{3}|20[0-9]{2})\b/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120) || null;

  return {
    found: true,
    pid,
    name,
    elevation: metres(text, "Elevation"),
    prominence: metres(text, "Prominence"),
    lat: coords ? Number(coords[1]) : null,
    lon: coords ? Number(coords[2]) : null,
    countryCode: country,
    admin1: state,
    firstAscentDate: faDate,
    firstAscentBy: faBy,
    url: `https://peakbagger.com/peak.aspx?pid=${pid}`,
  };
};

/**
 * Looks a peak up on Peakbagger by peak URL/ID or by name and returns the
 * facts we can pre-fill an "add a peak" form with. Never throws: Peakbagger
 * sits behind Cloudflare and can refuse the request.
 */
export const lookupPeakbaggerPeak = createServerFn({ method: "POST" })
  .inputValidator((input: { query: string }) => {
    const query = (input?.query ?? "").trim();
    if (query.length < 2) throw new Error("Enter a peak name or Peakbagger link");
    return { query: query.slice(0, 160) };
  })
  .handler(async ({ data }): Promise<PeakbaggerPeakInfo> => {
    try {
      let pid = data.query.match(/pid=(\d+)/i)?.[1] ?? (/^\d+$/.test(data.query) ? data.query : null);

      if (!pid) {
        // Peakbagger's own search is a postback form, so resolve the id with a
        // site-scoped web search through the proxy instead.
        pid = (await searchPeakbaggerPid(data.query)).pid;
        if (!pid) return { found: false, error: "No matching peak on Peakbagger." };
      }

      const page = await fetchPage(`https://peakbagger.com/peak.aspx?pid=${pid}`);
      if (page.blocked) return { found: false, blocked: true };
      if (page.status !== 200) return { found: false, error: `Peakbagger returned ${page.status}.` };

      return parsePeakPage(page.html, pid);
    } catch (err) {
      console.error("[peakbagger] lookup failed", err);
      return { found: false, error: "Could not reach Peakbagger right now." };
    }
  });
