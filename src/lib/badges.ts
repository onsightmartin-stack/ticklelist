import { isUnCountry } from "@/lib/profile-goals";
import { countries } from "@/data/countries";
import type { Ascent } from "@/lib/peak-catalog";
import { countsAsCountryHighpoint, highpointCreditKey } from "@/lib/historic-highpoints";
import { creditedHighpointCountries, isMainlandHighpointAscent } from "@/lib/mainland-credit";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  progress: number;
  target: number;
  /** Plain-language explanation of exactly what counts towards this badge. */
  detail?: string | undefined;
  /** The member's own entries that currently count (peak names, countries…). */
  counted?: string[] | undefined;
  /** Label for the counted list, e.g. "Peaks that count". */
  countedLabel?: string | undefined;
}

export interface Rank {
  name: string;
  min: number;
  blurb: string;
}

/** Rank ladder — driven by total logged ascents. */
export const ranks: Rank[] = [
  { name: "Trailhead", min: 0, blurb: "Just getting started." },
  { name: "Hiker", min: 1, blurb: "First summit in the book." },
  { name: "Scrambler", min: 5, blurb: "Hands on rock, regularly out." },
  { name: "Alpinist", min: 15, blurb: "Serious mountain mileage." },
  { name: "Highpointer", min: 30, blurb: "Collecting summits by country." },
  { name: "Mountaineer", min: 60, blurb: "A deep summit résumé." },
  { name: "Summit Legend", min: 100, blurb: "Rarefied air." },
];

const continentOf = (country: string | null) =>
  country ? countries.find((c) => c.country === country)?.continent ?? null : null;

export interface MemberStats {
  total: number;
  highpoints: number;
  famous: number;
  countries: number;
  continents: number;
  yearStreak: number;
  monthStreak: number;
  bestYear: number;
  /** Names behind the numbers, so badges can show what actually counted. */
  peakNames: string[];
  highpointNames: string[];
  famousNames: string[];
  countryNames: string[];
  continentNames: string[];
  bestYearLabel: string | null;
  /** Ascents shared with at least one named partner or logged as a group trip. */
  together: number;
  togetherNames: string[];
  /** Distinct people you've shared an adventure with. */
  partners: number;
  partnerNames: string[];
}

/** Longest run of consecutive periods that each contain at least one ascent. */
const longestStreak = (keys: number[]) => {
  const sorted = [...new Set(keys)].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const k of sorted) {
    run = prev !== null && k === prev + 1 ? run + 1 : 1;
    prev = k;
    if (run > best) best = run;
  }
  return best;
};

export const computeStats = (ascents: Ascent[]): MemberStats => {
  const countrySet = new Set<string>();
  const continentSet = new Set<string>();
  const years: number[] = [];
  const months: number[] = [];
  const perYear: Record<number, number> = {};

  for (const a of ascents) {
    if (a.country) countrySet.add(a.country);
    const cont = continentOf(a.country);
    if (cont) continentSet.add(cont);
    const d = new Date(a.ascent_date);
    if (!Number.isNaN(d.getTime())) {
      const y = d.getFullYear();
      years.push(y);
      months.push(y * 12 + d.getMonth());
      perYear[y] = (perYear[y] ?? 0) + 1;
    }
  }

  const creditedCountries = creditedHighpointCountries(ascents);
  const highpointNames = [
    ...new Set(
      ascents
        .filter(
          (a) =>
            isUnCountry(a.country ?? a.peak_name) &&
            creditedCountries.has(a.country ?? a.peak_name) &&
            (countsAsCountryHighpoint(a) || isMainlandHighpointAscent(a)),
        )
        .map((a) => `${a.peak_name}${a.country ? ` (${a.country})` : ""}`),
    ),
  ];
  const famousNames = ascents
    .filter((a) => a.peak_type !== "country_highpoint")
    .map((a) => `${a.peak_name}${a.country ? ` (${a.country})` : ""}`);
  const bestYearEntry = Object.entries(perYear).sort((a, b) => b[1] - a[1])[0] ?? null;

  const partnerSet = new Set<string>();
  const togetherNames: string[] = [];
  for (const a of ascents) {
    const ids = a.partner_ids ?? [];
    const names = (a.partner_names ?? []).filter((n) => n && n.trim());
    const shared = ids.length > 0 || names.length > 0 || a.with_group === true;
    if (!shared) continue;
    for (const id of ids) partnerSet.add(`id:${id}`);
    for (const n of names) partnerSet.add(`name:${n.trim().toLowerCase()}`);
    const who = names.length
      ? names.join(", ")
      : ids.length
        ? `${ids.length} member${ids.length > 1 ? "s" : ""}`
        : "group trip";
    togetherNames.push(`${a.peak_name}${a.country ? ` (${a.country})` : ""} — with ${who}`);
  }

  return {
    total: ascents.length,
    highpoints: highpointNames.length,
    famous: famousNames.length,
    peakNames: ascents.map((a) => a.peak_name),
    highpointNames,
    famousNames,
    countryNames: [...countrySet].sort(),
    continentNames: [...continentSet].sort(),
    bestYearLabel: bestYearEntry ? `${bestYearEntry[0]} — ${bestYearEntry[1]} ascents` : null,
    countries: countrySet.size,
    continents: continentSet.size,
    yearStreak: longestStreak(years),
    monthStreak: longestStreak(months),
    bestYear: Math.max(0, ...Object.values(perYear)),
    together: togetherNames.length,
    togetherNames,
    partners: partnerSet.size,
    partnerNames: [
      ...new Set((ascents.flatMap((a) => a.partner_names ?? []) as string[]).map((n) => n.trim()).filter(Boolean)),
    ].sort(),
  };
};

export const rankFor = (total: number): { current: Rank; next: Rank | null } => {
  let current = ranks[0]!;
  for (const r of ranks) if (total >= r.min) current = r;
  const next = ranks.find((r) => r.min > total) ?? null;
  return { current, next };
};

const badge = (
  id: string,
  name: string,
  description: string,
  icon: string,
  progress: number,
  target: number,
  detail?: string,
  counted?: string[],
  countedLabel?: string,
): Badge => ({
  id,
  name,
  description,
  icon,
  progress: Math.min(progress, target),
  target,
  earned: progress >= target,
  detail,
  counted,
  countedLabel,
});

/** XP milestone ladder — combined climbing + exploring XP. */
const xpMilestones: { id: string; name: string; icon: string; target: number }[] = [
  { id: "xp-1k", name: "First Thousand", icon: "✨", target: 1_000 },
  { id: "xp-10k", name: "Ten Thousand Club", icon: "💠", target: 10_000 },
  { id: "xp-50k", name: "Fifty K", icon: "🔷", target: 50_000 },
  { id: "xp-100k", name: "Six Figures", icon: "💎", target: 100_000 },
  { id: "xp-250k", name: "Quarter Million", icon: "🏅", target: 250_000 },
  { id: "xp-500k", name: "Half Million", icon: "🥇", target: 500_000 },
  { id: "xp-1m", name: "Millionaire", icon: "👑", target: 1_000_000 },
  { id: "xp-5m", name: "Five Million", icon: "🌟", target: 5_000_000 },
  { id: "xp-10m", name: "Legend of the Ledger", icon: "🪐", target: 10_000_000 },
];

const fmt = (n: number) =>
  n >= 1_000_000 ? `${n / 1_000_000}M` : n >= 1_000 ? `${n / 1_000}k` : `${n}`;

const ALL_ASCENTS = "Every ascent in your log counts once, including repeats of the same peak.";
const HP_RULE =
  "Only ascents logged as a country high point, and only for UN member states — one per country, so repeats don't double up. Taiwan and non-UN territories are excluded.";
const FAMOUS_RULE =
  "Any logged ascent that is NOT a country high point: named classics, volcanoes, local hills, imported peaks — the ordinary mountains in your log. Each ascent counts, so five separate outings on the same hill also get you there.";
const COUNTRY_RULE = "Distinct countries attached to your ascents (any peak type, high point or not).";
const CONTINENT_RULE =
  "Continents derived from the country on each ascent — Europe, Asia, Africa, North America, South America, Oceania, Antarctica.";
const TOGETHER_RULE =
  "Any logged adventure where you tagged at least one co-climber (a Ticklelist member or a free-text name) or marked it as a group trip. Each outing counts once.";
const PARTNERS_RULE =
  "Distinct people across all your adventures — tagged members and named co-climbers counted separately, each person only once no matter how often you go out together.";

export const computeBadges = (stats: MemberStats, totalXp = 0): Badge[] => [
  badge("first-summit", "First Summit", "Log your first ascent", "🥾", stats.total, 1, ALL_ASCENTS),
  badge("ten-summits", "Ten Summits", "Log 10 ascents", "⛰️", stats.total, 10, ALL_ASCENTS),
  badge("fifty-summits", "Fifty Summits", "Log 50 ascents", "🏔️", stats.total, 50, ALL_ASCENTS),
  badge("hp-5", "Country Collector", "5 country high points", "🚩", stats.highpoints, 5, HP_RULE, stats.highpointNames, "Your high points"),
  badge("hp-25", "Border Hopper", "25 country high points", "🌍", stats.highpoints, 25, HP_RULE, stats.highpointNames, "Your high points"),
  badge("countries-10", "Ten Countries", "Climb in 10 different countries", "🗺️", stats.countries, 10, COUNTRY_RULE, stats.countryNames, "Countries you've climbed in"),
  badge("continents-3", "Three Continents", "Climb on 3 continents", "🧭", stats.continents, 3, CONTINENT_RULE, stats.continentNames, "Continents so far"),
  badge("continents-6", "Globetrotter", "Climb on 6 continents", "✈️", stats.continents, 6, CONTINENT_RULE, stats.continentNames, "Continents so far"),
  badge("famous-5", "Classic Lines", "5 peaks that aren't country high points", "⭐", stats.famous, 5, FAMOUS_RULE, stats.famousNames, "Peaks counting towards this"),
  badge("streak-months-3", "On a Roll", "Ascents in 3 consecutive months", "🔥", stats.monthStreak, 3, "Your longest run of back-to-back calendar months with at least one ascent in each. One empty month resets the run."),
  badge("streak-months-6", "Half-Year Streak", "Ascents in 6 consecutive months", "🔥", stats.monthStreak, 6, "Your longest run of back-to-back calendar months with at least one ascent in each. One empty month resets the run."),
  badge("streak-years-3", "Consistent", "Ascents in 3 consecutive years", "📅", stats.yearStreak, 3, "Your longest run of back-to-back calendar years with at least one ascent in each."),
  badge(
    "big-year",
    "Big Year",
    "12 ascents in a single year",
    "🏆",
    stats.bestYear,
    12,
    "Counts ascents by calendar year and takes your busiest one. Year-only dates count towards that year.",
    stats.bestYearLabel ? [stats.bestYearLabel] : [],
    "Your busiest year",
  ),
  badge("together-1", "Better Together", "Share 1 adventure with a friend", "🤝", stats.together, 1, TOGETHER_RULE, stats.togetherNames, "Shared adventures"),
  badge("together-10", "Rope Team", "Share 10 adventures with friends", "🧗", stats.together, 10, TOGETHER_RULE, stats.togetherNames, "Shared adventures"),
  badge("together-25", "Expedition Crew", "Share 25 adventures with friends", "⛺", stats.together, 25, TOGETHER_RULE, stats.togetherNames, "Shared adventures"),
  badge("together-50", "Never Solo", "Share 50 adventures with friends", "🫂", stats.together, 50, TOGETHER_RULE, stats.togetherNames, "Shared adventures"),
  badge("partners-5", "Good Company", "Adventure with 5 different people", "👥", stats.partners, 5, PARTNERS_RULE, stats.partnerNames, "People you've named"),
  badge("partners-15", "Social Climber", "Adventure with 15 different people", "🎉", stats.partners, 15, PARTNERS_RULE, stats.partnerNames, "People you've named"),
  ...xpMilestones.map((m) =>
    badge(
      m.id,
      m.name,
      `Reach ${fmt(m.target)} total XP (climbing + exploring)`,
      m.icon,
      totalXp,
      m.target,
      "Climbing XP (altitude × difficulty, repeats at 25%, plus completed-list bonuses) added to Explorer XP from countries, places and continent bonuses.",
    ),
  ),
];
