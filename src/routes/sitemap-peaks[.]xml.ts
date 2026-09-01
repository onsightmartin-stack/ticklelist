import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getPeakCountries, getSitemapPeaks } from "@/lib/peak-directory.functions";

const BASE_URL = "https://ticklelist.org";

export const Route = createFileRoute("/sitemap-peaks.xml")({
  server: {
    handlers: {
      GET: async () => {
        const [countries, peaks] = await Promise.all([
          getPeakCountries().catch(() => []),
          getSitemapPeaks().catch(() => []),
        ]);

        const locs = [
          `${BASE_URL}/peaks`,
          ...countries.map((c) => `${BASE_URL}/peaks/country/${c.code.toLowerCase()}`),
          ...peaks.map((p) => `${BASE_URL}/peaks/${p.id}`),
        ];

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...locs.map(
            (loc) => `  <url>\n    <loc>${loc}</loc>\n    <changefreq>monthly</changefreq>\n  </url>`,
          ),
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
