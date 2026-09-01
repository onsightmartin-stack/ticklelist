import { createFileRoute } from "@tanstack/react-router";
import FeaturedPeaksPage from "@/pages/FeaturedPeaksPage";

export const Route = createFileRoute("/featured")({
  head: () => ({
    meta: [
      { title: "Featured Peaks — Onsight Martin" },
      {
        name: "description",
        content:
          "Curated country high points with route notes, elevation stats and trip reports from the mission to climb every country's highest mountain.",
      },
      { property: "og:title", content: "Featured Peaks — Onsight Martin" },
      {
        property: "og:description",
        content:
          "Curated country high points with route notes, elevation stats and trip reports from the mission to climb every country's highest mountain.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FeaturedPeaksPage,
});
