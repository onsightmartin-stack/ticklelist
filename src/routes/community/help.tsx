import { createFileRoute } from "@tanstack/react-router";
import HelpPage from "@/pages/community/HelpPage";

export const Route = createFileRoute("/community/help")({
  head: () => ({
    meta: [
      { title: "Help & bug reports — Ticklelist" },
      { name: "description", content: "Report a bug or send an idea to the Ticklelist team." },
      { property: "og:title", content: "Help & bug reports — Ticklelist" },
      { property: "og:description", content: "Report a bug or send an idea to the Ticklelist team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HelpPage,
});
