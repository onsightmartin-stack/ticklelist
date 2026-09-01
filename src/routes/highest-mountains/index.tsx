import { createFileRoute } from "@tanstack/react-router";
import HighestMountainsPage from "@/pages/HighestMountainsPage";

const title = "Highest Mountain in Every Country on Earth (Full List)";
const description =
  "The highest mountain of all 195 countries, ranked by elevation, in metres and feet — with route notes, difficulty and summit videos for every country highpoint.";

export const Route = createFileRoute("/highest-mountains/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:image", content: "https://onsightmartin.com/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://onsightmartin.com/og-image.jpg" },
    ],
  }),
  component: () => <HighestMountainsPage />,
});
