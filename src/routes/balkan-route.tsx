import { createFileRoute } from "@tanstack/react-router";
import BalkanRoute from "@/pages/BalkanRoute";

const title = "Balkan Highpoint Route — Onsight Martin";
const description =
  "Private planning page for the Balkan country highpoint road trip.";

export const Route = createFileRoute("/balkan-route")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: BalkanRoute,
});
