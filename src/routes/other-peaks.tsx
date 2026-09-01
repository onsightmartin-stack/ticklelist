import { createFileRoute } from "@tanstack/react-router";
import OtherPeaks from "@/pages/OtherPeaks";

const title = "Other Peaks — Climbs Beyond the 195 Highpoints";
const description =
  "Notable summits outside the country highpoint mission: alpine routes, volcanoes and side peaks climbed along the way.";

export const Route = createFileRoute("/other-peaks")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://onsightmartin.com/other-peaks" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://onsightmartin.com/other-peaks" }],
  }),
  component: OtherPeaks,
});
