/**
 * Data helpers for the "highest mountain in every country" hub pages.
 *
 * These pages exist to catch the highest-volume search phrasing
 * ("highest mountain in every country", "highest mountain in Europe by
 * country") and funnel readers into the per-country peak pages.
 */
import { countries, type CountryHighPoint } from "@/data/countries";
import { elevationOf } from "@/data/guides";
import { slugify } from "@/lib/slug";

export interface ContinentHub {
  slug: string;
  /** Continent as stored in countries.ts */
  name: string;
  /** Adjective used in copy: "European countries" */
  adjective: string;
  blurb: string;
}

export const continentHubs: ContinentHub[] = [
  {
    slug: "europe",
    name: "Europe",
    adjective: "European",
    blurb:
      "From Mont Blanc's 4,807 m to Vatican-sized hills, Europe packs the widest spread of country highpoints anywhere — glaciated alpine summits and roadside hilltops within a day's drive of each other.",
  },
  {
    slug: "asia",
    name: "Asia",
    adjective: "Asian",
    blurb:
      "Asia holds Everest and thirteen other 8,000 m giants, but also gentle island highpoints in the Maldives and Singapore that take minutes rather than months.",
  },
  {
    slug: "africa",
    name: "Africa",
    adjective: "African",
    blurb:
      "Kilimanjaro is the famous one, but Africa's 54 country highpoints run from volcanic craters and desert plateaus to jungle-ringed peaks that see a handful of ascents a year.",
  },
  {
    slug: "north-america",
    name: "North America",
    adjective: "North American",
    blurb:
      "Denali and Logan anchor the continent, while the Caribbean nations add short, steep, tropical highpoints that can be climbed in a single morning.",
  },
  {
    slug: "south-america",
    name: "South America",
    adjective: "South American",
    blurb:
      "Aconcagua tops the continent and the Andes supply almost every other summit — high altitude, long approaches and reliably dry climbing seasons.",
  },
  {
    slug: "oceania",
    name: "Oceania",
    adjective: "Oceanian",
    blurb:
      "Puncak Jaya and Mount Wilhelm aside, Oceania's highpoints are remote island summits where the hardest part is arranging the boat, flight or landowner permission.",
  },
  {
    slug: "antarctica",
    name: "Antarctica",
    adjective: "Antarctic",
    blurb:
      "No country owns Antarctica, but every piece of land on Earth counts here — Vinson Massif is the continent's highpoint and one of the Seven Summits.",
  },
];

export function findContinentHub(slug: string): ContinentHub | undefined {
  return continentHubs.find((c) => c.slug === slug.toLowerCase());
}

export interface HubRow {
  country: string;
  continent: string;
  peak: string;
  elevation: number;
  elevationLabel: string;
  path: string;
  climbed: boolean;
  year?: number;
}

export function toRow(c: CountryHighPoint): HubRow {
  return {
    country: c.country,
    continent: c.continent,
    peak: c.highPoint,
    elevation: elevationOf(c),
    elevationLabel: c.elevation,
    path: `/peak/${slugify(c.country)}`,
    climbed: c.status === "climbed" || c.status === "legal_high_point",
    ...(c.year !== undefined ? { year: c.year } : {}),
  };
}

/** All country highpoints, highest first. Optionally filtered to one continent. */
export function hubRows(continent?: string): HubRow[] {
  return countries
    .filter((c) => !continent || c.continent === continent)
    .map(toRow)
    .sort((a, b) => b.elevation - a.elevation);
}

export function metres(n: number): string {
  return `${n.toLocaleString("en-GB")} m`;
}

export function feet(n: number): string {
  return `${Math.round(n * 3.28084).toLocaleString("en-GB")} ft`;
}
