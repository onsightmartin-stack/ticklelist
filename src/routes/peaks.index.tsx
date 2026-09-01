import { createFileRoute } from "@tanstack/react-router";
import PeakDirectoryPage from "@/pages/PeakDirectoryPage";
import { getPeakCountries, getTopPeaks } from "@/lib/peak-directory.functions";

const title = "Peak directory — every mountain, elevation and prominence | Ticklelist";
const description =
  "Browse over a million catalogued summits by country: elevation, prominence, coordinates and community ascents. Log your own climbs free on Ticklelist.";
const url = "https://ticklelist.org/peaks";

export const Route = createFileRoute("/peaks/")({
  loader: async () => {
    const [countries, peaks] = await Promise.all([
      getPeakCountries().catch(() => []),
      getTopPeaks({ data: { limit: 100 } }).catch(() => []),
    ]);
    return { countries, peaks };
  },
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: url }],
  }),
  component: PeakDirectoryRoute,
});

function PeakDirectoryRoute() {
  const { countries, peaks } = Route.useLoaderData();
  return <PeakDirectoryPage countries={countries} peaks={peaks} />;
}
