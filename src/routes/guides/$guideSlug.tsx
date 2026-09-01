import { createFileRoute } from "@tanstack/react-router";
import GuidePage from "@/pages/GuidePage";
import { getGuide } from "@/data/guides";

const SITE = "https://onsightmartin.com";
const OG_IMAGE = `${SITE}/og-image.jpg`;

export const Route = createFileRoute("/guides/$guideSlug")({
  head: ({ params }) => {
    const guide = getGuide(params.guideSlug);
    const title = guide
      ? `${guide.seoTitle} | Onsight Martin`
      : "Highpointing Guides — Onsight Martin";
    const description =
      guide?.description ??
      "Ranked lists of the world's country highpoints: the full list, the easiest, the hardest and the best beginner peaks.";
    const url = `${SITE}/guides/${params.guideSlug}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:site_name", content: "Onsight Martin" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:image", content: OG_IMAGE },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: OG_IMAGE },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: GuidePage,
});
