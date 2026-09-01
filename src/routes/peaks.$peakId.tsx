import { createFileRoute } from "@tanstack/react-router";
import WorldPeakPage, { countryName } from "@/pages/WorldPeakPage";
import { getWorldPeak, getPeakAscents } from "@/lib/peak-detail.functions";

export const Route = createFileRoute("/peaks/$peakId")({
  loader: async ({ params }) => {
    const id = Number(params.peakId);
    if (!Number.isFinite(id) || id <= 0) return { peak: null, ascents: [] };
    try {
      const peak = await getWorldPeak({ data: { id } });
      if (!peak) return { peak: null, ascents: [] };
      const ascents = await getPeakAscents({ data: { name: peak.name } }).catch(() => []);
      return { peak, ascents };
    } catch {
      return { peak: null, ascents: [] };
    }
  },
  head: ({ loaderData }) => {
    const peak = loaderData?.peak;
    if (!peak) {
      return {
        meta: [
          { title: "Peak not found | Ticklelist" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const country = countryName(peak.countryCode);
    const title = `${peak.name}${peak.elevation ? ` (${peak.elevation} m)` : ""} | Ticklelist`;
    const description = `${peak.name}${country ? ` in ${country}` : ""}${
      peak.elevation ? ` rises to ${peak.elevation} m` : ""
    }. Elevation, prominence, coordinates and map preview.`;
    const url = `https://ticklelist.org/peaks/${peak.id}`;
    return {
      meta: [
        { title: title.length > 60 ? `${peak.name} | Ticklelist` : title },
        { name: "description", content: description.slice(0, 158) },
        { property: "og:title", content: title },
        { property: "og:description", content: description.slice(0, 158) },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Mountain",
            name: peak.name,
            url,
            ...(peak.elevation
              ? { elevation: { "@type": "QuantitativeValue", value: peak.elevation, unitCode: "MTR" } }
              : {}),
            ...(peak.lat != null && peak.lon != null
              ? { geo: { "@type": "GeoCoordinates", latitude: peak.lat, longitude: peak.lon } }
              : {}),
            ...(country ? { address: { "@type": "PostalAddress", addressCountry: country } } : {}),
          }),
        },
      ],
    };
  },

  component: PeakDetailRoute,
});

function PeakDetailRoute() {
  const { peak, ascents } = Route.useLoaderData();
  return <WorldPeakPage peak={peak} ascents={ascents} />;
}
