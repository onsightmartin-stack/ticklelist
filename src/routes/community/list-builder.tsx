import { createFileRoute } from "@tanstack/react-router";
import ListBuilderPage from "@/pages/community/ListBuilderPage";

export const Route = createFileRoute("/community/list-builder")({
  head: () => ({
    meta: [
      { title: "Peak List Builder | Ticklelist" },
      {
        name: "description",
        content:
          "Build a live peak challenge from 1.3 million summits — filter by country, elevation and prominence, then track your ticks and XP.",
      },
      { property: "og:title", content: "Peak List Builder | Ticklelist" },
      {
        property: "og:description",
        content:
          "Filter the world peak catalogue by country, height and prominence and track your progress against your own list.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ListBuilderPage,
});
