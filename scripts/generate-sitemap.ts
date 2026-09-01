// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.

import { writeFileSync } from "fs";
import { resolve } from "path";
import { countries } from "../src/data/countries";
import { guides } from "../src/data/guides";
import { continentHubs } from "../src/lib/highest-mountains";
import { slugify } from "../src/lib/slug";


const BASE_URL = "https://onsightmartin.com";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const entries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/featured", changefreq: "monthly", priority: "0.8" },
  { path: "/guides", changefreq: "weekly", priority: "0.9" },
  ...guides.map((g) => ({
    path: `/guides/${g.slug}`,
    changefreq: "weekly" as const,
    priority: "0.9",
  })),
  { path: "/other-peaks", changefreq: "monthly", priority: "0.7" },
  { path: "/highest-mountains", changefreq: "weekly", priority: "0.95" },
  ...continentHubs.map((c) => ({
    path: `/highest-mountains/${c.slug}`,
    changefreq: "weekly" as const,
    priority: "0.85",
  })),
  { path: "/start", changefreq: "monthly", priority: "0.6" },

  { path: "/latest", changefreq: "weekly", priority: "0.8" },
  { path: "/team", changefreq: "yearly", priority: "0.5" },
  { path: "/where", changefreq: "daily", priority: "0.6" },
  { path: "/community", changefreq: "daily", priority: "0.7" },
  { path: "/support", changefreq: "monthly", priority: "0.5" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },

  ...countries.map((c) => ({
    path: `/peak/${slugify(c.country)}`,
    changefreq: "monthly" as const,
    priority: c.status === "climbed" || c.status === "legal_high_point" ? "0.8" : "0.6",
  })),
];

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
