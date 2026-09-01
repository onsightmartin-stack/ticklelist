import { createFileRoute } from "@tanstack/react-router";
import GuidesIndexPage from "@/pages/GuidesIndexPage";

const SITE = "https://onsightmartin.com";
const OG_IMAGE = `${SITE}/og-image.jpg`;
const title = "Highpointing Guides & Lists — Onsight Martin";
const description =
  "Ranked lists of the world's country highpoints: the full list, the easiest, the hardest, the best beginner peaks and the great volcanoes.";
const url = `${SITE}/guides`;

export const Route = createFileRoute("/guides/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:site_name", content: "Onsight Martin" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: url }],
  }),
  component: GuidesIndexPage,
});
