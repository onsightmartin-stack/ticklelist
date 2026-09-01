/**
 * Derived detail blocks for guide pages: quick stats, difficulty spread,
 * best-season windows and typical route options — all computed from the
 * existing country / peak / difficulty datasets so every guide stays in sync.
 */
import type { CountryHighPoint } from "@/data/countries";
import { countryDifficulty, difficultyConfig, type Difficulty } from "@/data/difficulty";
import { peakDetails } from "@/data/peak-details";
import { elevationOf } from "@/data/guides";

export const DIFFICULTY_ORDER: Difficulty[] = ["very_easy", "easy", "moderate", "hard", "expert"];

export interface QuickStats {
  count: number;
  climbed: number;
  highest: { country: string; peak: string; elevation: number } | undefined;
  lowest: { country: string; peak: string; elevation: number } | undefined;
  medianElevation: number;
  totalVertical: number;
  continents: string[];
  ranges: { range: string; count: number }[];
}

const nameOf = (c: CountryHighPoint) => peakDetails[c.country]?.peak ?? c.highPoint;

export function quickStats(rows: CountryHighPoint[]): QuickStats {
  const withElev = rows
    .map((c) => ({ country: c.country, peak: nameOf(c), elevation: elevationOf(c) }))
    .filter((r) => r.elevation > 0)
    .sort((a, b) => b.elevation - a.elevation);

  const rangeCounts = new Map<string, number>();
  rows.forEach((c) => {
    const range = peakDetails[c.country]?.range;
    if (!range) return;
    rangeCounts.set(range, (rangeCounts.get(range) ?? 0) + 1);
  });

  const mid = withElev.length ? withElev[Math.floor(withElev.length / 2)]!.elevation : 0;

  return {
    count: rows.length,
    climbed: rows.filter((c) => (c.status === "climbed" || c.status === "legal_high_point") && c.unMember !== false).length,
    highest: withElev[0],
    lowest: withElev[withElev.length - 1],
    medianElevation: mid,
    totalVertical: withElev.reduce((sum, r) => sum + r.elevation, 0),
    continents: [...new Set(rows.map((c) => c.continent))].sort(),
    ranges: [...rangeCounts.entries()]
      .map(([range, count]) => ({ range, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
  };
}

export function difficultyBreakdown(rows: CountryHighPoint[]) {
  const counts = new Map<Difficulty, number>();
  rows.forEach((c) => {
    const d = countryDifficulty[c.country]?.difficulty;
    if (d) counts.set(d, (counts.get(d) ?? 0) + 1);
  });
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  return DIFFICULTY_ORDER.filter((d) => counts.has(d)).map((d) => ({
    difficulty: d,
    label: difficultyConfig[d].label,
    color: difficultyConfig[d].color,
    bgColor: difficultyConfig[d].bgColor,
    count: counts.get(d)!,
    share: total ? Math.round(((counts.get(d)! / total) * 100)) : 0,
    examples: rows
      .filter((c) => countryDifficulty[c.country]?.difficulty === d)
      .slice(0, 3)
      .map((c) => `${nameOf(c)} (${c.country})`),
  }));
}

type SeasonBand = "northern" | "tropical" | "southern" | "polar";

const bandOf = (c: CountryHighPoint): SeasonBand => {
  const lat = peakDetails[c.country]?.coordinates.lat;
  if (lat === undefined) return c.continent === "Oceania" || c.continent === "South America" ? "southern" : "northern";
  if (lat <= -60) return "polar";
  if (lat >= 23.5) return "northern";
  if (lat <= -23.5) return "southern";
  return "tropical";
};

const SEASON_COPY: Record<SeasonBand, { window: string; note: string }> = {
  northern: {
    window: "June – September",
    note: "Northern-hemisphere summer: stable high pressure, melted-out approaches and long daylight. Shoulder weeks in May and October mean snow on the upper slopes.",
  },
  southern: {
    window: "December – March",
    note: "Southern-hemisphere summer. Expect the reverse calendar from Europe — the Andes and Oceania peaks come into condition when the Alps close out.",
  },
  tropical: {
    window: "Year-round, driest in the local dry season",
    note: "Near the equator temperature barely shifts; rainfall decides. Aim for the dry months and start before dawn to beat afternoon convection.",
  },
  polar: {
    window: "November – January",
    note: "Antarctic season only. Flights operate in the austral summer window and everything is logistics-driven.",
  },
};

export function seasonWindows(rows: CountryHighPoint[]) {
  const counts = new Map<SeasonBand, number>();
  rows.forEach((c) => {
    const b = bandOf(c);
    counts.set(b, (counts.get(b) ?? 0) + 1);
  });
  return (["northern", "southern", "tropical", "polar"] as SeasonBand[])
    .filter((b) => counts.has(b))
    .map((b) => ({ band: b, count: counts.get(b)!, ...SEASON_COPY[b] }))
    .sort((a, b) => b.count - a.count);
}

const ROUTE_COPY: Record<Difficulty, { title: string; style: string; gear: string }> = {
  very_easy: {
    title: "Walk-ups and drive-ups",
    style: "Marked trail, road or short forest walk. Under two hours for most people, no navigation problems.",
    gear: "Trainers or light boots, water, a phone map. Nothing technical.",
  },
  easy: {
    title: "Hiking routes",
    style: "Long day hikes on paths or easy scree, occasional hands-on scrambling steps but no exposure that needs a rope.",
    gear: "Boots, poles, layers, headtorch for an early start.",
  },
  moderate: {
    title: "Scrambles and glacier walks",
    style: "Sustained scrambling, via ferrata sections or straightforward glacier travel. Route-finding matters and afternoon weather forces early starts.",
    gear: "Helmet, harness, crampons and axe where glaciated; rope for the exposed steps.",
  },
  hard: {
    title: "Alpine routes",
    style: "Multi-day expeditions, high altitude, real glacier hazard or committing rock and ice. Acclimatisation is part of the plan.",
    gear: "Full alpine kit, crevasse rescue, tent or hut chain, and a partner you trust.",
  },
  expert: {
    title: "Expedition objectives",
    style: "Remote, permitted, politically restricted or extreme-altitude peaks. Months of planning, fixed logistics and often a narrow legal window.",
    gear: "Expedition setup, permits, local operator support, medical and comms plan.",
  },
};

export function routeOptions(rows: CountryHighPoint[]) {
  const present = new Set<Difficulty>();
  rows.forEach((c) => {
    const d = countryDifficulty[c.country]?.difficulty;
    if (d) present.add(d);
  });
  return DIFFICULTY_ORDER.filter((d) => present.has(d)).map((d) => ({
    difficulty: d,
    label: difficultyConfig[d].label,
    color: difficultyConfig[d].color,
    bgColor: difficultyConfig[d].bgColor,
    ...ROUTE_COPY[d],
    peaks: rows
      .filter((c) => countryDifficulty[c.country]?.difficulty === d)
      .slice(0, 4)
      .map((c) => ({ country: c.country, peak: nameOf(c) })),
  }));
}

export const fmt = (n: number) => n.toLocaleString("en-US");
