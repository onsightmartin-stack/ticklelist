import { createFileRoute } from "@tanstack/react-router";
import ScafellPikePage from "@/pages/ScafellPikePage";
import scafellSummit from "@/assets/scafell-pike-summit.jpg.asset.json";

const TITLE = "Scafell Pike (978 m): Highest Mountain in England";
const DESCRIPTION =
  "Scafell Pike, 978 m, is England's highest mountain. Routes from Wasdale, Seathwaite and Langdale, timings, conditions, photos and a summit video.";
const IMAGE = `https://onsightmartin.com${scafellSummit.url}`;

export const Route = createFileRoute("/peak/scafell-pike")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://onsightmartin.com/peak/scafell-pike" },
      { property: "og:image", content: IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: IMAGE },
    ],
  }),
  component: ScafellPikePage,
});
