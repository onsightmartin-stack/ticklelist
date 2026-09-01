import { createFileRoute } from "@tanstack/react-router";
import LatestClimbs from "@/pages/LatestClimbs";

const title = "Latest Climbs — Newest Country Highpoints";
const description =
  "The most recent country highpoints Martin has summited, with dates, elevations and the summit videos from each climb.";

export const Route = createFileRoute("/latest")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://onsightmartin.com/latest" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://onsightmartin.com/latest" }],
  }),
  component: LatestClimbs,
});
