import { createFileRoute } from "@tanstack/react-router";
import YouTubeStatsPage from "@/pages/YouTubeStatsPage";

const title = "YouTube link stats — Onsight Martin";
const description = "Private dashboard showing outbound YouTube link clicks.";

export const Route = createFileRoute("/admin/youtube-stats")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: YouTubeStatsPage,
});
