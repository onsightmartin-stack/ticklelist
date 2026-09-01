import { createFileRoute } from "@tanstack/react-router";
import PhotoVotePage from "@/pages/community/PhotoVotePage";

export const Route = createFileRoute("/community/photo-vote")({
  head: () => ({
    meta: [
      { title: "Summit Photo Vote — Ticklelist" },
      {
        name: "description",
        content:
          "Vote on member summit photos. Each peak's round runs 30 days from its first vote and the winner becomes the peak page's main image.",
      },
      { property: "og:title", content: "Summit Photo Vote — Ticklelist" },
      {
        property: "og:description",
        content: "Enter your best summit shot and vote for the photo that should headline each country high point.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PhotoVotePage,
});
