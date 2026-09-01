import { createFileRoute } from "@tanstack/react-router";
import Privacy from "@/pages/Privacy";

const title = "Privacy Policy — Onsight Martin & Ticklelist";
const description =
  "Privacy policy for Onsight Martin and the Ticklelist app: accounts, content uploads, location, analytics, and your data rights.";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://onsightmartin.com/privacy" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://onsightmartin.com/privacy" }],
  }),
  component: Privacy,
});
