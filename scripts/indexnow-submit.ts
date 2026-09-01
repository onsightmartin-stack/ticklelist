/**
 * IndexNow submission — pushes every URL in public/sitemap.xml to Bing (and
 * other IndexNow engines: Yandex, Seznam, Naver).
 *
 * Requires public/<KEY>.txt to be live at https://onsightmartin.com/<KEY>.txt
 *
 * Usage: bun run scripts/indexnow-submit.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const HOST = "onsightmartin.com";
const KEY = "9774da67247c1e9c6b1eddef003005bd";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const sitemap = readFileSync(resolve("public/sitemap.xml"), "utf8");
const urlList = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);

if (urlList.length === 0) {
  console.error("No URLs found in sitemap.xml");
  process.exit(1);
}

// Verify the key file is reachable before submitting.
const keyCheck = await fetch(KEY_LOCATION);
if (!keyCheck.ok) {
  console.error(
    `Key file not reachable at ${KEY_LOCATION} (HTTP ${keyCheck.status}). Publish the site first.`,
  );
  process.exit(1);
}

// IndexNow accepts up to 10,000 URLs per request.
const res = await fetch("https://api.indexnow.org/IndexNow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
});

console.log(`Submitted ${urlList.length} URLs — HTTP ${res.status}`);
console.log(await res.text());
