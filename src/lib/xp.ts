import { countryDifficulty, type Difficulty } from "@/data/difficulty";
import { famousPeaks } from "@/data/famous-peaks";
import { peakLists } from "@/data/peak-lists";
import type { Ascent } from "@/lib/peak-catalog";
import { resolveLevel } from "@/lib/level-ladder";
import { countsAsCountryHighpoint, highpointCreditKey } from "@/lib/historic-highpoints";


/**
 * Summit XP — a climber who ticks the 14 eight-thousanders should out-score a
 * climber who sweeps the European high points. XP scales steeply with altitude
 * and is multiplied by how hard the mountain is.
 */

export const difficultyMultiplier: Record<Difficulty, number> = {
  very_easy: 1,
  easy: 1.15,
  moderate: 1.4,
  hard: 1.8,
  expert: 2.3,
};

/** Repeats of a peak already logged still count, but only at a fraction. */
export const REPEAT_FACTOR = 0.25;
const MIN_XP = 25;

/** Nothing on Earth is higher than Everest — anything above is a feet/metre mix-up. */
const EVEREST_M = 8849;

export const parseElevation = (value: string | null | undefined): number => {
  if (!value) return 0;
  const n = Number(String(value).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n)) return 0;
  // A stray "13,864 m" is feet mislabelled as metres; score it as feet.
  return n > EVEREST_M ? Math.round(n * 0.3048) : n;
};

/** Difficulty for peaks outside the country high point list, by curated group. */
const groupDifficulty: Record<string, Difficulty> = {
  "8000ers": "expert",
  "Himalaya & Karakoram": "expert",
  "Seven Summits": "hard",
  "Americas": "hard",
  "Alps": "hard",
  "Volcanoes": "moderate",
  "Nordic & UK": "easy",
  "Africa & Oceania": "moderate",
  "Non-UN states": "easy",
  "US state high points": "easy",
  "Poland voivodeships": "easy",
};

const byElevation = (m: number): Difficulty =>
  m >= 7000 ? "expert" : m >= 5000 ? "hard" : m >= 2500 ? "moderate" : m >= 1000 ? "easy" : "very_easy";

export const difficultyFor = (ascent: Pick<Ascent, "peak_type" | "country" | "peak_name" | "elevation">): Difficulty => {
  const metres = parseElevation(ascent.elevation);
  if (ascent.peak_type === "country_highpoint" && ascent.country) {
    const d = countryDifficulty[ascent.country]?.difficulty;
    if (d) return d;
  }
  const fp = famousPeaks.find((p) => p.name === ascent.peak_name);
  const fromGroup = fp ? groupDifficulty[fp.group] : undefined;
  if (fromGroup) {
    // Never rate a giant as easy just because its group is mild.
    const alt = byElevation(metres);
    return difficultyMultiplier[alt] > difficultyMultiplier[fromGroup] ? alt : fromGroup;
  }
  return byElevation(metres);
};

/** Altitude curve: doubling the height gives roughly 4.5x the XP. */
export const baseXp = (metres: number) => Math.round(Math.pow(Math.max(metres, 0) / 1000, 2.2) * 100);

export interface AscentXp {
  xp: number;
  base: number;
  difficulty: Difficulty;
  multiplier: number;
  repeat: boolean;
}

export const xpForAscent = (
  ascent: Pick<Ascent, "peak_type" | "country" | "peak_name" | "elevation">,
  repeat = false,
): AscentXp => {
  const difficulty = difficultyFor(ascent);
  const multiplier = difficultyMultiplier[difficulty];
  const base = baseXp(parseElevation(ascent.elevation));
  const raw = Math.max(Math.round(base * multiplier), MIN_XP);
  return { xp: repeat ? Math.round(raw * REPEAT_FACTOR) : raw, base, difficulty, multiplier, repeat };
};

export interface Level {
  level: number;
  title: string;
  min: number;
}

const levelTitles = [
  "Trailhead", "Rambler", "Hiker", "Hillwalker", "Scrambler",
  "Trekker", "Ridge Runner", "Bothy Dweller", "Cairn Builder", "Highpointer",
  "Fell Runner", "Via Ferrata Fan", "Glacier Walker", "Rope Rookie", "Crampon Convert",
  "Alpinist", "Ice Climber", "Couloir Hunter", "North Face Novice", "Arête Artist",
  "Mountaineer", "Face Climber", "Mixed Ground Master", "Bivvy Veteran", "Storm Rider",
  "Big Wall", "Solo Wanderer", "Traverse Tactician", "Winter Warrior", "Cornice Reader",
  "Expedition Leader", "Basecamp Boss", "Acclimatisation Ace", "Altitude Hunter", "Thin Air Regular",
  "Sherpa's Equal", "Rope Fixer", "Serac Dodger", "Avalanche Whisperer", "Summit Pusher",
  "Seven Summiteer", "Second Summits Slayer", "Volcano Sweeper", "Range Collector", "Continental Crowned",
  "Alpine Purist", "Speed Ascentionist", "Enchainment Addict", "Ridge Line Royalty", "Granite Sovereign",
  "Death Zone", "6000er Regular", "7000er Regular", "8000er Rookie", "8000er Collector",
  "No-Oxygen Contender", "Karakoram Regular", "Himalaya Habitué", "Winter Himalayan", "K2 Class",
  "Grand Slam", "Explorers Grand Slam", "Polar Hauler", "Unclimbed Line Seeker", "First Ascentionist",
  "Cartographer of Summits", "Mountain Historian", "Guidebook Author", "Legend of the Valley", "Icefall Doctor",
  "Sky Runner Supreme", "Thin Air Sovereign", "Jet Stream Rider", "Cloud Line Dweller", "Stratosphere Scrambler",
  "Peak Whisperer", "Storm Summoner", "Mountain Oracle", "Keeper of the Cairns", "Wanderer of Ranges",
  "Titan of the Traverse", "Master of the Massif", "Lord of the Ledges", "Sovereign of Seracs", "Emperor of Everest",
  "Mythic Mountaineer", "Legend Unroped", "Immortal Alpinist", "Ascendant", "Skyborne",
  "Beyond the Summit", "Mountain Made Flesh", "The Unfalling", "Eternal Climber", "Summit Legend",
  "Zenith", "Apex Absolute", "The Last Ridge", "Crown of the World", "Summit of Summits",
];

/**
 * Level thresholds grow steeply through the 100 curated titles, and then keep
 * going forever — past "Summit of Summits" the ladder extends endlessly
 * (Summit of Summits II, III, ...), so there is no XP or level cap.
 */
const MAX_LEVEL_XP = 1_000_000;
export const levels: Level[] = levelTitles.map((title, i) => ({
  level: i + 1,
  title,
  min:
    i === 0
      ? 0
      : Math.max(
          50,
          Math.round((MAX_LEVEL_XP * Math.pow(i / (levelTitles.length - 1), 2.2)) / 50) * 50,
        ),
}));



export interface XpSummary {
  total: number;
  level: Level;
  next: Level | null;
  intoLevel: number;
  levelSpan: number;
  pct: number;
  /** Highest-scoring single ascent. */
  best: { name: string; xp: number } | null;
  /** XP earned from finishing whole tick lists. */
  listBonus: number;
  /** Names of the lists completed. */
  completedLists: string[];
}

/** Flat bonus for completing every peak on a curated tick list. */
export const LIST_COMPLETION_BONUS = 1000;

const catalogKey = (a: Pick<Ascent, "peak_type" | "country" | "peak_name" | "ascent_date">) =>
  highpointCreditKey(a);

/** Lists fully ticked by these ascents. */
export const completedListsFor = (ascents: Ascent[]): string[] => {
  const keys = new Set(ascents.map(catalogKey));
  return peakLists
    .filter(
      (l) =>
        l.entries.length > 0 &&
        l.entries.every((e) => keys.has(e.key) || (e.alt ?? []).some((k) => keys.has(k))),
    )
    .map((l) => l.name);
};

export const computeXp = (ascents: Ascent[]): XpSummary => {
  const seen = new Set<string>();
  let total = 0;
  let best: { name: string; xp: number } | null = null;

  const ordered = [...ascents].sort(
    (a, b) => parseElevation(b.elevation) - parseElevation(a.elevation),
  );

  for (const a of ordered) {
    const key = `${a.peak_type}:${a.peak_name}`;
    const repeat = seen.has(key);
    seen.add(key);
    const { xp } = xpForAscent(a, repeat);
    total += xp;
    if (!repeat && (!best || xp > best.xp)) best = { name: a.peak_name, xp };
  }

  const completedLists = completedListsFor(ascents);
  const listBonus = completedLists.length * LIST_COMPLETION_BONUS;
  total += listBonus;

  const { level, next } = resolveLevel(levels, total);
  const levelSpan = Math.max(1, next.min - level.min);
  const intoLevel = total - level.min;

  return {
    total,
    level,
    next,
    intoLevel,
    levelSpan,
    pct: Math.min(100, Math.round((intoLevel / levelSpan) * 100)),
    best,
    listBonus,
    completedLists,
  };
};


export const formatXp = (xp: number) => xp.toLocaleString();
