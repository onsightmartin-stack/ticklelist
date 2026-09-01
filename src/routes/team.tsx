import { createFileRoute } from "@tanstack/react-router";
import Team from "@/pages/Team";

const title = "The Team Behind Onsight Martin";
const description =
  "Meet the climbers, editors and volunteers making the country highpointing project possible — and how to get involved.";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://onsightmartin.com/team" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://onsightmartin.com/team" }],
  }),
  component: Team,
});
