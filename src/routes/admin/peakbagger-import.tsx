import { createFileRoute } from "@tanstack/react-router";
import PeakbaggerImportPage from "@/pages/PeakbaggerImportPage";

const title = "Peakbagger import status — Onsight Martin";
const description = "Private dashboard showing Peakbagger import progress and errors.";

export const Route = createFileRoute("/admin/peakbagger-import")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PeakbaggerImportPage,
});
