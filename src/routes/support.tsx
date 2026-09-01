import { createFileRoute } from "@tanstack/react-router";
import Support from "@/pages/Support";

const title = "Support the Expedition — Onsight Martin";
const description =
  "Help fund the climb of every country's highest mountain: one-off tips, PayPal, or free ways to support the expedition.";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://onsightmartin.com/support" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://onsightmartin.com/support" }],
  }),
  component: Support,
});
