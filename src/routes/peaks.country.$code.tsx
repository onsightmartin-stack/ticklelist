import { createFileRoute } from "@tanstack/react-router";
import PeakCountryPage from "@/pages/PeakCountryPage";
import { getCountryPeaks } from "@/lib/peak-directory.functions";
import { countryName } from "@/pages/WorldPeakPage";

export const Route = createFileRoute("/peaks/country/$code")({
  loader: async ({ params }) => {
    const code = String(params.code ?? "").toUpperCase();
    if (!/^[A-Z]{2}$/.test(code)) return { code, peaks: [] };
    const peaks = await getCountryPeaks({ data: { code, limit: 150 } }).catch(() => []);
    return { code, peaks };
  },
  head: ({ params }) => {
    const code = String(params.code ?? "").toUpperCase();
    const name = countryName(code) ?? code;
    const title = `Highest peaks in ${name} | Ticklelist`;
    const description = `The most prominent mountains in ${name} — elevation, prominence and community ascents. Track the ones you have climbed on Ticklelist.`;
    const url = `https://ticklelist.org/peaks/country/${code.toLowerCase()}`;
    return {
      meta: [
        { title },
        { name: "description", content: description.slice(0, 158) },
        { property: "og:title", content: title },
        { property: "og:description", content: description.slice(0, 158) },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: PeakCountryRoute,
});

function PeakCountryRoute() {
  const { code, peaks } = Route.useLoaderData();
  return <PeakCountryPage code={code} peaks={peaks} />;
}
