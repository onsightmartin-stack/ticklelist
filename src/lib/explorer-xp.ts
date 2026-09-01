import { countries } from "@/data/countries";
import type { Visit } from "@/data/places";
import { resolveLevel } from "@/lib/level-ladder";


/**
 * Explorer XP — a second, independent track from climbing XP. You can be a
 * Level 7 climber and a Level 30 explorer (or the other way round).
 * Earned by ticking countries, wonders, landmarks and the poles.
 */

export const explorerXpForType: Record<string, number> = {
  country: 150,
  wonder: 250,
  natural_wonder: 250,
  landmark: 120,
  /** Everyday sightseeing — fun to tick, but worth far less than a wonder. */
  sightseeing: 60,
  pole: 2000,
};

const DEFAULT_PLACE_XP = 100;
/** First tick of a continent — being somewhere genuinely new is the point. */
export const CONTINENT_BONUS = 400;
/** Every continent ticked, Antarctica included. The big one. */
export const ALL_CONTINENTS_BONUS = 10000;
export const ALL_CONTINENTS = [
  "Africa",
  "Asia",
  "Europe",
  "North America",
  "South America",
  "Oceania",
  "Antarctica",
];

export const xpForVisit = (v: Pick<Visit, "place_type">) =>
  explorerXpForType[v.place_type] ?? DEFAULT_PLACE_XP;


const continentOf = (country: string | null) =>
  country ? countries.find((c) => c.country === country)?.continent ?? null : null;

export interface ExplorerLevel {
  level: number;
  title: string;
  min: number;
}

/** Tongue-in-cheek explorer ladder. */
const explorerTitles = [
  "Couch Cartographer",
  "Staycationer",
  "Weekend Wanderer",
  "Lost Tourist",
  "Backpack Rookie",
  "Passport Stamper",
  "Hostel Legend",
  "Tintin",
  "Postcard Hoarder",
  "Border Hopper",
  "Map Whisperer",
  "Marco Polo Jr.",
  "Tomb Raider",
  "Jungle Booker",
  "Compass Bandit",
  "Indiana Understudy",
  "Phileas Fogg",
  "Caravan Nomad",
  "Continental Drifter",
  "Amelia's Wingman",
  "Shackleton's Apprentice",
  "Dr. Livingstone, I Presume",
  "Magellan Enjoyer",
  "Silk Road Regular",
  "Ibn Battuta",
  "Pole Poker",
  "Atlas Rewriter",
  "Globe Trotting Menace",
  "Around the World in 80 Ticks",
  "Grand Slam Vagabond",
  "Indiana Jones",
  "Dora the Destroyer",
  "Astronaut in Training",
  "Moon Walker",
  "Intergalactic Backpacker",
  "Cosmic Conquistador",
  "Star-Hopping Legend",
  "Trans-Stellar Vagabond",
  "Galaxy Cartographer Supreme",
  "Universe Whisperer",
  "Multidimensional Nomad",
  "Reality-Bending Explorer",
  "Timeline Surfer",
  "Quantum Wanderer",
  "All-Seeing Nomad",
  "Omniscient Globe-Trotter",
  "Mythical Pathfinder",
  "Legendary Wayfinder",
  "Eternal Wanderer",
  "Cosmic Eternal Explorer",
  "Atlas Reborn",
  "Keeper of Coastlines",
  "Desert Crossing Champion",
  "Rainforest Regular",
  "Tundra Tramp",
  "Archipelago Addict",
  "Island Hopper Supreme",
  "Steppe Strider",
  "Savannah Sovereign",
  "Fjord Fanatic",
  "Volcano Voyager",
  "Salt Flat Sailor",
  "Monsoon Chaser",
  "Trade Wind Rider",
  "Caravanserai Regular",
  "Lighthouse Collector",
  "Border Post Baron",
  "Visa Page Hoarder",
  "Transit Lounge Emperor",
  "Overlander",
  "Ocean Swimmer",
  "Seven Seas Sailor",
  "Polar Circle Crosser",
  "Equator Regular",
  "Meridian Master",
  "Antipodes Aficionado",
  "Wonder Collector",
  "Ancient World Walker",
  "Ruins Reader",
  "Pilgrim of Everywhere",
  "Nomad Emeritus",
  "Chronicle Keeper",
  "Living Atlas",
  "World Ticker",
  "Grand Circumnavigator",
  "Every Flag Flown",
  "Cartographer Laureate",
  "Horizon Hunter",
  "Edge of the Map",
  "Terra Incognita Tamer",
  "Planet Completionist",
  "Explorer Absolute",
  "The Whole World Over",
  "Beyond the Atlas",
  "Last Great Journey",
  "Everywhere, Twice",
  "Compass Retired",
  "Story of Every Border",
  "The World, Ticked",
  "Explorer Eternal",

];

/**
 * The ladder now runs to 100. The top rung sits beyond a full sweep of every
 * country, wonder, pole and landmark, so nobody maxes out in a single season.
 */
const MAX_EXPLORER_XP = 100_000;
export const explorerLevels: ExplorerLevel[] = explorerTitles.map((title, i) => ({
  level: i + 1,
  title,
  min:
    i === 0
      ? 0
      : Math.max(
          50,
          Math.round((MAX_EXPLORER_XP * Math.pow(i / (explorerTitles.length - 1), 2.2)) / 50) * 50,
        ),
}));


export interface ExplorerSummary {
  total: number;
  level: ExplorerLevel;
  next: ExplorerLevel | null;
  intoLevel: number;
  levelSpan: number;
  pct: number;
  countries: number;
  places: number;
  continents: number;
  continentBonus: number;
  allContinents: boolean;
  best: { name: string; xp: number } | null;
}

export const computeExplorerXp = (visits: Visit[]): ExplorerSummary => {
  const seen = new Set<string>();
  const continentsSet = new Set<string>();
  let total = 0;
  let countriesCount = 0;
  let places = 0;
  let best: { name: string; xp: number } | null = null;

  for (const v of visits) {
    if (seen.has(v.place_key)) continue;
    seen.add(v.place_key);
    const xp = xpForVisit(v);
    total += xp;
    if (v.place_type === "country") countriesCount += 1;
    else places += 1;
    if (!best || xp > best.xp) best = { name: v.place_name, xp };

    const c = v.place_type === "pole" && v.place_name !== "North Pole" ? "Antarctica" : continentOf(v.country);
    if (c) continentsSet.add(c);
  }

  const allContinents = ALL_CONTINENTS.every((c) => continentsSet.has(c));
  const continentBonus =
    continentsSet.size * CONTINENT_BONUS + (allContinents ? ALL_CONTINENTS_BONUS : 0);
  total += continentBonus;

  const { level, next } = resolveLevel(explorerLevels, total);
  const levelSpan = Math.max(1, next.min - level.min);
  const intoLevel = total - level.min;

  return {
    total,
    level,
    next,
    intoLevel,
    levelSpan,
    pct: Math.min(100, Math.round((intoLevel / levelSpan) * 100)),
    countries: countriesCount,
    places,
    continents: continentsSet.size,
    allContinents,
    continentBonus,
    best,
  };
};

