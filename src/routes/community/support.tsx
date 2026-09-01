import { createFileRoute } from "@tanstack/react-router";
import CommunitySupportPage from "@/pages/community/CommunitySupportPage";

const title = "Support the Ticklelist Community — Ticklelist";
const description =
  "Ticklelist is free and ad-free, funded entirely by its founder. Help keep the community running — chip in toward server and hosting costs, or support us for free by subscribing on YouTube.";

export const Route = createFileRoute("/community/support")({
  component: CommunitySupportPage,
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ticklelist.org/community/support" },
      { property: "og:site_name", content: "Ticklelist" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://ticklelist.org/community/support" },
    ],
  }),
});
