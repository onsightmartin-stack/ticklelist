import { createFileRoute } from "@tanstack/react-router";
import IntroPage from "@/pages/community/IntroPage";

export const Route = createFileRoute("/community/intro")({
  head: () => ({
    meta: [
      { title: "Introduction — how Ticklelist works" },
      {
        name: "description",
        content:
          "A guide to every Ticklelist feature: logging ascents and places, XP and levels, badges, tick lists, rankings, the wall, Base Camp, themes and the mobile app.",
      },
      { property: "og:title", content: "Introduction — how Ticklelist works" },
      {
        property: "og:description",
        content: "Every Ticklelist feature explained: ascents, places, XP, badges, lists, rankings and the community.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IntroPage,
});
