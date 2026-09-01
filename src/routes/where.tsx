import { createFileRoute } from "@tanstack/react-router";
import WhereIsMartin from "@/pages/WhereIsMartin";

const title = "Where Is Martin? Live Expedition Tracker";
const description =
  "See Martin's latest tracked position and the route so far on the way to the highest mountain of every country on Earth.";

export const Route = createFileRoute("/where")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://onsightmartin.com/where" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://onsightmartin.com/where" }],
  }),
  component: WhereIsMartin,
});
