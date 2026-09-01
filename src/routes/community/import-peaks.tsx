import { createFileRoute } from "@tanstack/react-router";
import PeakImportPage from "@/pages/community/PeakImportPage";

export const Route = createFileRoute("/community/import-peaks")({
  head: () => ({
    meta: [
      { title: "Peak import — Ticklelist" },
      { name: "description", content: "Admin tool for bulk-adding peaks to the Ticklelist catalog from CSV or JSON." },
      { property: "og:title", content: "Peak import — Ticklelist" },
      { property: "og:description", content: "Bulk-add peaks to the Ticklelist catalog." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PeakImportPage,
});
