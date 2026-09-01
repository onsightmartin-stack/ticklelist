import { createFileRoute, notFound } from "@tanstack/react-router";
import HighestMountainsPage from "@/pages/HighestMountainsPage";
import { findContinentHub, hubRows } from "@/lib/highest-mountains";

export const Route = createFileRoute("/highest-mountains/$continentSlug")({
  head: ({ params }) => {
    const hub = findContinentHub(params.continentSlug);
    if (!hub) {
      return { meta: [{ title: "Highest mountains by continent | Onsight Martin" }] };
    }
    const rows = hubRows(hub.name);
    const title = `Highest Mountain in Every ${hub.adjective} Country`;
    const description = `All ${rows.length} ${hub.adjective} country highpoints ranked by elevation, from ${rows[0]?.peak} (${rows[0]?.elevationLabel}) down — heights in metres and feet with route notes.`;
    return {
      meta: [
        { title },
        { name: "description", content: description.slice(0, 155) },
        { property: "og:title", content: title },
        { property: "og:description", content: description.slice(0, 155) },
        { property: "og:type", content: "article" },
        { property: "og:image", content: "https://onsightmartin.com/og-image.jpg" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: "https://onsightmartin.com/og-image.jpg" },
      ],
    };
  },
  component: ContinentHubRoute,
});

function ContinentHubRoute() {
  const { continentSlug } = Route.useParams();
  const hub = findContinentHub(continentSlug);
  if (!hub) throw notFound();
  return <HighestMountainsPage hub={hub} />;
}
