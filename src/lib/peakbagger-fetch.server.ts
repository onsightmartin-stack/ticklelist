/**
 * Single place where we talk to Peakbagger.
 *
 * Peakbagger sits behind Cloudflare and returns a "Just a moment" challenge to
 * plain server-side fetches, so every request goes through the Firecrawl proxy
 * (gateway-backed connector). A direct fetch is kept only as a last-resort
 * fallback for the rare case where the proxy is unavailable.
 *
 * Peakbagger is the ONLY source of record for peak facts on this site.
 * Wikipedia (or anything derived from it) must never be used.
 */

const GATEWAY = "https://connector-gateway.lovable.dev/firecrawl/v2";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

export interface PeakbaggerPage {
  html: string;
  markdown: string;
  status: number;
  blocked: boolean;
  via: "firecrawl" | "direct";
}

export const isChallengeHtml = (html: string) =>
  html.includes("Just a moment") ||
  html.includes("cf-challenge") ||
  html.includes("Performing security verification");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Firecrawl rate-limits per minute; back off and retry rather than fail. */
const gatewayPost = async (
  path: string,
  body: unknown,
  keys: { lovableKey: string; firecrawlKey: string },
): Promise<Response | null> => {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(`${GATEWAY}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${keys.lovableKey}`,
        "X-Connection-Api-Key": keys.firecrawlKey,
      },
      body: JSON.stringify(body),
    });
    if (res.status !== 429 && res.status !== 502 && res.status !== 503) return res;
    await sleep(8000 * (attempt + 1));
  }
  return null;
};

const directFetch = async (url: string): Promise<PeakbaggerPage> => {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  const html = await res.text();
  return {
    html,
    markdown: "",
    status: res.status,
    blocked: res.status === 403 || isChallengeHtml(html),
    via: "direct",
  };
};

/** Fetch any peakbagger.com URL. Never throws — inspect `blocked`/`status`. */
export const fetchPeakbagger = async (url: string): Promise<PeakbaggerPage> => {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const firecrawlKey = process.env["FIRECRAWL_API_KEY"];

  if (lovableKey && firecrawlKey) {
    try {
      const res = await gatewayPost(
        "/scrape",
        { url, formats: ["markdown", "html"], onlyMainContent: false },
        { lovableKey, firecrawlKey },
      );
      if (!res) return directFetch(url);
      if (res.ok) {
        const body = (await res.json()) as {
          markdown?: string;
          html?: string;
          data?: { markdown?: string; html?: string };
        };
        const markdown = body.markdown ?? body.data?.markdown ?? "";
        const html = body.html ?? body.data?.html ?? "";
        if (markdown || html) {
          return {
            html,
            markdown,
            status: 200,
            blocked: isChallengeHtml(html) || markdown.includes("Just a moment"),
            via: "firecrawl",
          };
        }
      } else {
        console.error(`[peakbagger] firecrawl ${res.status}: ${(await res.text()).slice(0, 300)}`);
      }
    } catch (err) {
      console.error("[peakbagger] firecrawl request failed", err);
    }
  }

  return directFetch(url);
};

/** Find a Peakbagger peak id for a free-text peak name (proxy web search). */
export const searchPeakbaggerPid = async (
  query: string,
): Promise<{ pid: string | null; title?: string }> => {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const firecrawlKey = process.env["FIRECRAWL_API_KEY"];
  if (!lovableKey || !firecrawlKey) return { pid: null };

  try {
    const res = await gatewayPost(
      "/search",
      { query: `site:peakbagger.com peak.aspx ${query}`, limit: 8 },
      { lovableKey, firecrawlKey },
    );
    if (!res) return { pid: null };
    if (!res.ok) {
      console.error(`[peakbagger] search ${res.status}: ${(await res.text()).slice(0, 300)}`);
      return { pid: null };
    }
    const body = (await res.json()) as {
      data?: { web?: Array<{ url: string; title?: string }> };
    };
    for (const hit of body.data?.web ?? []) {
      const pid = hit.url.match(/peak\.aspx\?pid=(\d+)/i)?.[1];
      if (pid) return { pid, ...(hit.title ? { title: hit.title } : {}) };
    }
    return { pid: null };
  } catch (err) {
    console.error("[peakbagger] search failed", err);
    return { pid: null };
  }
};
