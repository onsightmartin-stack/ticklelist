import { createFileRoute } from "@tanstack/react-router";
import StartPage from "@/pages/StartPage";

const title = "Start Your Own Tick List — Onsight Martin";
const description =
  "Came from the videos? Track every summit you've climbed, build bucket lists and follow other climbers on Ticklelist — free.";

export const Route = createFileRoute("/start")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:site_name", content: "Onsight Martin" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://onsightmartin.com/start" },
      { property: "og:image", content: "https://onsightmartin.com/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: "https://onsightmartin.com/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://onsightmartin.com/start" }],
  }),
  component: StartPage,
});
