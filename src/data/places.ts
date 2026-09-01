import { fuzzyFieldScore } from "@/lib/fuzzy";
import { countries } from "@/data/countries";

export type PlaceType = "country" | "wonder" | "natural_wonder" | "pole" | "landmark";

export interface CatalogPlace {
  key: string;
  name: string;
  country: string | null;
  type: PlaceType;
  group: string;
  /** Approximate coordinates for map placement, when known. */
  lat?: number;
  lng?: number;
}

const countryEntries: CatalogPlace[] = countries
  .filter((c) => c.country !== "Antarctica")
  .map((c) => ({
    key: `co:${c.country}`,
    name: c.country,
    country: c.country,
    type: "country" as const,
    group: `Countries · ${c.continent}`,
  }));

/** Curated non-country places worth ticking off. */
const curated: Array<Omit<CatalogPlace, "key">> = [
  // New7Wonders of the World
  { name: "Great Wall of China", country: "China", type: "wonder", group: "New 7 Wonders", lat: 40.4319, lng: 116.5704 },
  { name: "Petra", country: "Jordan", type: "wonder", group: "New 7 Wonders", lat: 30.3285, lng: 35.4444 },
  { name: "Christ the Redeemer", country: "Brazil", type: "wonder", group: "New 7 Wonders", lat: 22.9519, lng: 43.2105 },
  { name: "Machu Picchu", country: "Peru", type: "wonder", group: "New 7 Wonders", lat: -13.1631, lng: -72.5450 },
  { name: "Chichén Itzá", country: "Mexico", type: "wonder", group: "New 7 Wonders", lat: 20.6843, lng: -88.5678 },
  { name: "Colosseum", country: "Italy", type: "wonder", group: "New 7 Wonders", lat: 41.8902, lng: 12.4922 },
  { name: "Taj Mahal", country: "India", type: "wonder", group: "New 7 Wonders", lat: 27.1751, lng: 78.0421 },
  { name: "Great Pyramid of Giza", country: "Egypt", type: "wonder", group: "New 7 Wonders", lat: 29.9792, lng: 31.1342 },

  // Seven Wonders of the Ancient World
  { name: "Hanging Gardens of Babylon", country: "Iraq", type: "wonder", group: "Ancient 7 Wonders", lat: 32.5422, lng: 44.4231 },
  { name: "Statue of Zeus at Olympia", country: "Greece", type: "wonder", group: "Ancient 7 Wonders", lat: 37.6386, lng: 21.6301 },
  { name: "Temple of Artemis at Ephesus", country: "Turkey", type: "wonder", group: "Ancient 7 Wonders", lat: 37.9497, lng: 27.3639 },
  { name: "Mausoleum at Halicarnassus", country: "Turkey", type: "wonder", group: "Ancient 7 Wonders", lat: 37.0379, lng: 27.4236 },
  { name: "Colossus of Rhodes", country: "Greece", type: "wonder", group: "Ancient 7 Wonders", lat: 36.4512, lng: 28.2217 },
  { name: "Lighthouse of Alexandria", country: "Egypt", type: "wonder", group: "Ancient 7 Wonders", lat: 31.2079, lng: 29.8870 },

  // Natural wonders
  { name: "Grand Canyon", country: "United States", type: "natural_wonder", group: "Natural wonders", lat: 36.0544, lng: -112.1401 },
  { name: "Great Barrier Reef", country: "Australia", type: "natural_wonder", group: "Natural wonders", lat: -18.2871, lng: 147.6992 },
  { name: "Harbour of Rio de Janeiro", country: "Brazil", type: "natural_wonder", group: "Natural wonders", lat: -22.9707, lng: -43.3045 },
  { name: "Victoria Falls", country: "Zambia/Zimbabwe", type: "natural_wonder", group: "Natural wonders", lat: -17.9243, lng: 25.8572 },
  { name: "Northern Lights", country: null, type: "natural_wonder", group: "Natural wonders", lat: 69.6492, lng: 18.9553 },
  { name: "Parícutin volcano", country: "Mexico", type: "natural_wonder", group: "Natural wonders", lat: 19.4995, lng: -102.2527 },
  { name: "Mount Everest Base Camp", country: "Nepal", type: "natural_wonder", group: "Natural wonders", lat: 28.0022, lng: 86.8527 },

  // Poles
  { name: "North Pole", country: null, type: "pole", group: "Poles", lat: 90, lng: 0 },
  { name: "South Pole", country: "Antarctica", type: "pole", group: "Poles", lat: -90, lng: 0 },
  { name: "Antarctica (continent)", country: "Antarctica", type: "pole", group: "Poles", lat: -82, lng: 0 },

  // Landmarks people love ticking
  { name: "Eiffel Tower", country: "France", type: "landmark", group: "Landmarks", lat: 48.8584, lng: 2.2945 },
  { name: "Stonehenge", country: "United Kingdom", type: "landmark", group: "Landmarks", lat: 51.1789, lng: -1.8262 },
  { name: "Angkor Wat", country: "Cambodia", type: "landmark", group: "Landmarks", lat: 13.4125, lng: 103.8670 },
  { name: "Hagia Sophia", country: "Turkey", type: "landmark", group: "Landmarks", lat: 41.0086, lng: 28.9802 },
  { name: "Sagrada Família", country: "Spain", type: "landmark", group: "Landmarks", lat: 41.4036, lng: 2.1744 },
  { name: "Statue of Liberty", country: "United States", type: "landmark", group: "Landmarks", lat: 40.6892, lng: -74.0445 },
  { name: "Uluru", country: "Australia", type: "landmark", group: "Landmarks", lat: -25.3444, lng: 131.0369 },
  { name: "Salar de Uyuni", country: "Bolivia", type: "landmark", group: "Landmarks", lat: -20.1338, lng: -67.4891 },
  { name: "Sahara desert", country: null, type: "landmark", group: "Landmarks", lat: 23.4162, lng: 25.6628 },
  { name: "Galápagos Islands", country: "Ecuador", type: "landmark", group: "Landmarks", lat: -0.7393, lng: -90.3318 },

  // Oceans — for the "swim in every ocean" crowd
  { name: "Atlantic Ocean", country: null, type: "natural_wonder", group: "Oceans" },
  { name: "Pacific Ocean", country: null, type: "natural_wonder", group: "Oceans" },
  { name: "Indian Ocean", country: null, type: "natural_wonder", group: "Oceans" },
  { name: "Arctic Ocean", country: null, type: "natural_wonder", group: "Oceans" },
  { name: "Southern Ocean", country: null, type: "natural_wonder", group: "Oceans" },

  // Seas and famous waters
  { name: "Mediterranean Sea", country: null, type: "natural_wonder", group: "Seas & waters" },
  { name: "Baltic Sea", country: null, type: "natural_wonder", group: "Seas & waters" },
  { name: "Black Sea", country: null, type: "natural_wonder", group: "Seas & waters" },
  { name: "Red Sea", country: null, type: "natural_wonder", group: "Seas & waters" },
  { name: "Caribbean Sea", country: null, type: "natural_wonder", group: "Seas & waters" },
  { name: "Caspian Sea", country: null, type: "natural_wonder", group: "Seas & waters" },
  { name: "Dead Sea", country: "Israel/Jordan", type: "natural_wonder", group: "Seas & waters" },
  { name: "Lake Baikal", country: "Russia", type: "natural_wonder", group: "Seas & waters" },

  // Great deserts
  { name: "Gobi desert", country: null, type: "natural_wonder", group: "Great deserts" },
  { name: "Atacama desert", country: "Chile", type: "natural_wonder", group: "Great deserts" },
  { name: "Namib desert", country: "Namibia", type: "natural_wonder", group: "Great deserts" },
  { name: "Kalahari desert", country: null, type: "natural_wonder", group: "Great deserts" },
  { name: "Rub' al Khali (Empty Quarter)", country: "Saudi Arabia", type: "natural_wonder", group: "Great deserts" },
  { name: "Antarctic polar desert", country: "Antarctica", type: "natural_wonder", group: "Great deserts" },

  // Extremities of mainland Europe
  { name: "Cabo da Roca (westernmost)", country: "Portugal", type: "landmark", group: "European extremities" },
  { name: "Kinnarodden (northernmost)", country: "Norway", type: "landmark", group: "European extremities" },
  { name: "Punta de Tarifa (southernmost)", country: "Spain", type: "landmark", group: "European extremities" },
  { name: "Cape Flissingsky (easternmost)", country: "Russia", type: "landmark", group: "European extremities" },
];


const curatedEntries: CatalogPlace[] = curated.map((p) => ({ ...p, key: `pl:${p.name}` }));

export const placeCatalog: CatalogPlace[] = [...countryEntries, ...curatedEntries];

export const findPlace = (key: string) => placeCatalog.find((p) => p.key === key);

export const searchPlaces = (query: string, limit = 8): CatalogPlace[] => {
  if (!query.trim()) return [];
  const scored = placeCatalog
    .map((p) => ({
      p,
      score: Math.min(fuzzyFieldScore(query, p.name), fuzzyFieldScore(query, p.country ?? "") + 0.5),
    }))
    .filter((s) => Number.isFinite(s.score))
    .sort((a, b) => a.score - b.score || a.p.name.localeCompare(b.p.name));
  return scored.slice(0, limit).map((s) => s.p);
};

export interface Visit {
  id: string;
  user_id: string;
  place_key: string;
  place_name: string;
  country: string | null;
  place_type: string;
  visit_date: string | null;
  date_precision?: "day" | "month" | "year" | null;
  notes: string | null;
  photo_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}
