import { createFileRoute } from "@tanstack/react-router";
import PeakPage from "@/pages/PeakPage";
import { peakDetails } from "@/data/peak-details";
import { peakSeo } from "@/data/peak-seo";
import { personalNotes } from "@/data/personal-notes";
import { countries } from "@/data/countries";
import { findCountryBySlug } from "@/lib/slug";

export const Route = createFileRoute("/peak/$countrySlug")({
  head: ({ params }) => {
    const country = findCountryBySlug(params.countrySlug, countries);
    const detail = country ? peakDetails[country] : undefined;
    if (!country || !detail) {
      return {
        meta: [
          { title: "Country Highpoint — Onsight Martin" },
          { name: "description", content: "Country highpoint route notes, photos and summit videos." },
        ],
      };
    }
    const override = peakSeo[country];
    const rawTitle = `${detail.peak} — ${country}`;
    const title =
      override?.title ??
      (rawTitle.length > 52 ? `${rawTitle.slice(0, 49)}… | Onsight Martin` : `${rawTitle} | Onsight Martin`);
    const note = personalNotes[country];
    const rawDescription = note
      ? `${detail.peak} (${detail.elevation.toLocaleString()} m) is the highest mountain of ${country}. ${note}`
      : `${detail.peak} (${detail.elevation.toLocaleString()} m) is the highest mountain of ${country}. Route, season, difficulty and summit video.`;
    const description =
      override?.description ??
      (rawDescription.length > 155 ? `${rawDescription.slice(0, 152)}…` : rawDescription);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:image", content: detail.photoUrl },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: detail.photoUrl },
      ],
    };
  },
  component: PeakPage,
});
