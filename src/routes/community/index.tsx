import { createFileRoute } from "@tanstack/react-router";
import CommunityHome from "@/pages/community/CommunityHome";

const title = "Ticklelist — Your adventure bucketlist and peakbagging community!";
const description =
  "From the highpoint of the Maldives to the top of Everest, Vatican City to the Taj Mahal — document your adventures, plan trips with friends and compete with XP and levels.";

export const Route = createFileRoute("/community/")({
  component: CommunityHome,
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ticklelist.org/community" },
      { property: "og:image", content: "https://ticklelist.org/og-image-ticklelist.jpg" },
      { property: "og:site_name", content: "Ticklelist" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://ticklelist.org/og-image-ticklelist.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://ticklelist.org/community" }],
  }),
});
