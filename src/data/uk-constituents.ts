import snowdonSummit from "@/assets/snowdon-summit.png.asset.json";
import slieveDonardSummit from "@/assets/slieve-donard-summit.jpg.asset.json";
import benNevisSummit from "@/assets/ben-nevis-summit.jpg.asset.json";
import scafellSummit from "@/assets/scafell-pike-summit.jpg.asset.json";
import scafellSelfie from "@/assets/scafell-pike-selfie.jpg.asset.json";

export interface ConstituentPhoto {
  url: string;
  caption?: string;
}

export interface ConstituentHighpoint {
  nation: string;
  peak: string;
  elevation: number; // metres
  date: string; // display date
  photos?: ConstituentPhoto[];
}

// The four constituent-country highpoints of the United Kingdom — all summited in July 2026.
export const ukConstituentHighpoints: ConstituentHighpoint[] = [
  {
    nation: "Wales",
    peak: "Snowdon (Yr Wyddfa)",
    elevation: 1085,
    date: "6 Jul 2026",
    photos: [
      {
        url: snowdonSummit.url,
        caption: "Friendly local on the Snowdon summit ridge, Wales — 6 July 2026",
      },
    ],
  },
  {
    nation: "Northern Ireland",
    peak: "Slieve Donard",
    elevation: 850,
    date: "14 Jul 2026",
    photos: [
      {
        url: slieveDonardSummit.url,
        caption: "Summit cairn on Slieve Donard, Northern Ireland — 14 July 2026",
      },
    ],
  },
  {
    nation: "Scotland",
    peak: "Ben Nevis",
    elevation: 1345,
    date: "17 Jul 2026",
    photos: [
      {
        url: benNevisSummit.url,
        caption: "Summit trig point on Ben Nevis, Scotland — 17 July 2026",
      },
    ],
  },
  {
    nation: "England",
    peak: "Scafell Pike",
    elevation: 978,
    date: "22 Jul 2026",
    photos: [
      {
        url: scafellSummit.url,
        caption: "Summit cairn on Scafell Pike, England — 22 July 2026",
      },
      {
        url: scafellSelfie.url,
        caption: "On the Scafell Pike summit ridge — 22 July 2026",
      },
    ],
  },
];
