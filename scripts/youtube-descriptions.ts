/**
 * Generates a ready-to-paste YouTube description block for every country
 * highpoint that has a summit video, with the matching /peak/ URL, chapters
 * placeholder and hashtags. Point #4 of the SEO plan: turn YouTube traffic
 * into site traffic.
 *
 * Usage: bun run scripts/youtube-descriptions.ts
 * Output: docs/seo/youtube-descriptions.md
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { countries } from "../src/data/countries";
import { peakDetails } from "../src/data/peak-details";
import { personalNotes } from "../src/data/personal-notes";
import { slugify } from "../src/lib/slug";

const SITE = "https://onsightmartin.com";

const blocks: string[] = [
  "# YouTube description templates",
  "",
  "Paste the block below into the matching video description in YouTube Studio.",
  "The first link should stay in the first two lines so it is visible without",
  "clicking \"more\". Add real chapter timestamps before publishing.",
  "",
];

for (const c of countries) {
  const detail = peakDetails[c.country];
  if (!detail?.youtubeUrl) continue;
  const url = `${SITE}/peak/${slugify(c.country)}`;
  const matchUrl = `${SITE}/community/ascents?new=1&peak=${encodeURIComponent(`hp:${c.country}`)}`;
  const note = personalNotes[c.country];
  const tag = detail.peak.replace(/[^A-Za-z0-9]/g, "");
  const countryTag = c.country.replace(/[^A-Za-z0-9]/g, "");

  blocks.push(
    `## ${detail.peak} — ${c.country} (${detail.elevation.toLocaleString()} m)`,
    "",
    "```text",
    `${detail.peak} (${detail.elevation.toLocaleString()} m) is the highest mountain of ${c.country}.`,
    `Full route notes, photos and conditions: ${url}`,
    "",
    note ? note : detail.description,
    "",
    `This climb is part of the mission to summit the highest mountain of every country on Earth — all 195 of them. Track the full project: ${SITE}`,
    "",
    "CHAPTERS",
    "00:00 Intro",
    "00:00 Approach",
    "00:00 Summit",
    "",
    `Climbed it too, or planning it? Log it and find climbing partners: ${matchUrl}`,
    "",
    "LINKS",
    `Peak page (route, photos, conditions): ${url}`,
    `Match me to this peak (opens the summit log with ${detail.peak} pre-filled): ${matchUrl}`,
    `All country highpoints: ${SITE}/guides/highest-point-in-every-country`,
    `Latest climbs: ${SITE}/latest`,
    `Where I am right now: ${SITE}/where`,
    `Support the project: ${SITE}/support`,
    "",
    `#${tag} #${countryTag} #highpointing #countryhighpoints #mountaineering`,
    "```",
    "",
  );
}

mkdirSync(resolve("docs/seo"), { recursive: true });
writeFileSync(resolve("docs/seo/youtube-descriptions.md"), blocks.join("\n"), "utf8");
console.log(`Wrote docs/seo/youtube-descriptions.md (${(blocks.length - 5) / 24} videos)`);
