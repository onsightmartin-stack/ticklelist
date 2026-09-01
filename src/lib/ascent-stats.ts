import { isUnCountry } from "@/lib/profile-goals";
import type { Ascent } from "@/lib/peak-catalog";
import { computeXp, difficultyFor, parseElevation } from "@/lib/xp";
import type { Difficulty } from "@/data/difficulty";
import { countsAsCountryHighpoint, highpointCreditKey } from "@/lib/historic-highpoints";
import { creditedHighpointCountries } from "@/lib/mainland-credit";

/** Meteorological seasons, northern hemisphere; southern peaks are flipped. */
const SOUTHERN = new Set([
  "Argentina", "Chile", "Australia", "New Zealand", "South Africa", "Namibia", "Botswana",
  "Zimbabwe", "Zambia", "Mozambique", "Madagascar", "Peru", "Bolivia", "Brazil", "Paraguay",
  "Uruguay", "Angola", "Tanzania", "Indonesia", "Papua New Guinea", "Fiji", "Lesotho", "Eswatini",
]);

export type Season = "Winter" | "Spring" | "Summer" | "Autumn";

export const seasonFor = (ascent: Pick<Ascent, "ascent_date" | "country">): Season => {
  const month = Number(ascent.ascent_date.slice(5, 7));
  const north: Season =
    month === 12 || month <= 2 ? "Winter" : month <= 5 ? "Spring" : month <= 8 ? "Summer" : "Autumn";
  if (!ascent.country || !SOUTHERN.has(ascent.country)) return north;
  const flip: Record<Season, Season> = { Winter: "Summer", Summer: "Winter", Spring: "Autumn", Autumn: "Spring" };
  return flip[north];
};

export interface Band {
  label: string;
  min: number;
  max: number;
  count: number;
}

export interface AscentStats {
  total: number;
  uniquePeaks: number;
  repeats: number;
  mostRepeated?: { name: string; times: number } | undefined;
  highPoints: number;
  famous: number;
  other: number;
  countries: number;
  topCountry?: { name: string; count: number } | undefined;
  totalMetres: number;
  everests: number;
  highest?: Ascent | undefined;
  lowest?: Ascent | undefined;
  averageMetres: number;
  medianMetres: number;
  withElevation: number;
  bands: Band[];
  seasons: Record<Season, number>;
  months: number[];
  busiestMonth?: { month: number; count: number } | undefined;
  years: { year: string; count: number; metres: number }[];
  activeYears: number;
  perYear: number;
  bestYear?: { year: string; count: number } | undefined;
  longestYearStreak: number;
  firstAscent?: Ascent | undefined;
  latestAscent?: Ascent | undefined;
  daysSinceLast?: number | undefined;
  activeDays: number;
  bestDay?: { date: string; count: number } | undefined;
  multiPeakDays: number;
  difficulty: Record<Difficulty, number>;
  hardest?: { ascent: Ascent; difficulty: Difficulty } | undefined;
  withPhoto: number;
  withReport: number;
  withRoute: number;
  totalXp: number;
  level: number;
  levelTitle: string;
}

const BANDS: Omit<Band, "count">[] = [
  { label: "Under 500 m", min: 0, max: 499 },
  { label: "500 m+", min: 500, max: 999 },
  { label: "1000ers", min: 1000, max: 1999 },
  { label: "2000ers", min: 2000, max: 2999 },
  { label: "3000ers", min: 3000, max: 3999 },
  { label: "4000ers", min: 4000, max: 4999 },
  { label: "5000ers", min: 5000, max: 5999 },
  { label: "6000ers", min: 6000, max: 6999 },
  { label: "7000ers", min: 7000, max: 7999 },
  { label: "8000ers", min: 8000, max: 99999 },
];

const DIFFS: Difficulty[] = ["very_easy", "easy", "moderate", "hard", "expert"];
const DIFF_RANK: Record<Difficulty, number> = { very_easy: 0, easy: 1, moderate: 2, hard: 3, expert: 4 };

export const computeAscentStats = (input: Ascent[]): AscentStats => {
  const ascents = [...input].sort((a, b) => a.ascent_date.localeCompare(b.ascent_date));
  const total = ascents.length;

  const peakCounts = new Map<string, number>();
  const countryCounts = new Map<string, number>();
  const dayCounts = new Map<string, number>();
  const yearMap = new Map<string, { count: number; metres: number }>();
  const months = new Array(12).fill(0) as number[];
  const seasons: Record<Season, number> = { Winter: 0, Spring: 0, Summer: 0, Autumn: 0 };
  const difficulty: Record<Difficulty, number> = { very_easy: 0, easy: 0, moderate: 0, hard: 0, expert: 0 };

  let totalMetres = 0;
  let withElevation = 0;
  let withPhoto = 0;
  let withReport = 0;
  let withRoute = 0;
  let highest: Ascent | undefined;
  let lowest: Ascent | undefined;
  let hardest: { ascent: Ascent; difficulty: Difficulty } | undefined;
  const elevations: number[] = [];

  for (const a of ascents) {
    const key = `${a.peak_name.toLowerCase()}|${(a.country ?? "").toLowerCase()}`;
    peakCounts.set(key, (peakCounts.get(key) ?? 0) + 1);
    if (a.country) countryCounts.set(a.country, (countryCounts.get(a.country) ?? 0) + 1);
    dayCounts.set(a.ascent_date, (dayCounts.get(a.ascent_date) ?? 0) + 1);

    const year = a.ascent_date.slice(0, 4);
    const metres = parseElevation(a.elevation);
    const y = yearMap.get(year) ?? { count: 0, metres: 0 };
    yearMap.set(year, { count: y.count + 1, metres: y.metres + metres });

    const monthIndex = Number(a.ascent_date.slice(5, 7)) - 1;
    if (monthIndex >= 0 && monthIndex < 12) months[monthIndex] = (months[monthIndex] ?? 0) + 1;
    seasons[seasonFor(a)] += 1;

    if (metres > 0) {
      withElevation += 1;
      totalMetres += metres;
      elevations.push(metres);
      if (!highest || metres > parseElevation(highest.elevation)) highest = a;
      if (!lowest || metres < parseElevation(lowest.elevation)) lowest = a;
    }

    const d = difficultyFor(a);
    difficulty[d] += 1;
    if (!hardest || DIFF_RANK[d] > DIFF_RANK[hardest.difficulty]) hardest = { ascent: a, difficulty: d };

    if (a.photo_url) withPhoto += 1;
    if (a.trip_report) withReport += 1;
    if (a.route) withRoute += 1;
  }

  const uniquePeaks = peakCounts.size;
  const repeats = total - uniquePeaks;
  const mostRepeatedEntry = [...peakCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const mostRepeated =
    mostRepeatedEntry && mostRepeatedEntry[1] > 1
      ? {
          name:
            ascents.find(
              (a) => `${a.peak_name.toLowerCase()}|${(a.country ?? "").toLowerCase()}` === mostRepeatedEntry[0],
            )?.peak_name ?? mostRepeatedEntry[0],
          times: mostRepeatedEntry[1],
        }
      : undefined;

  const topCountryEntry = [...countryCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const bestDayEntry = [...dayCounts.entries()].sort((a, b) => b[1] - a[1] || b[0].localeCompare(a[0]))[0];

  const bands = BANDS.map((b) => ({
    ...b,
    count: elevations.filter((m) => m >= b.min && m <= b.max).length,
  })).filter((b) => b.count > 0);

  const sortedEl = [...elevations].sort((a, b) => a - b);
  const medianMetres = sortedEl.length
    ? sortedEl.length % 2
      ? (sortedEl[(sortedEl.length - 1) / 2] ?? 0)
      : Math.round(((sortedEl[sortedEl.length / 2 - 1] ?? 0) + (sortedEl[sortedEl.length / 2] ?? 0)) / 2)
    : 0;

  const years = [...yearMap.entries()]
    .map(([year, v]) => ({ year, ...v }))
    .sort((a, b) => b.year.localeCompare(a.year));
  const bestYear = [...years].sort((a, b) => b.count - a.count || b.year.localeCompare(a.year))[0];

  const yearNums = years.map((y) => Number(y.year)).sort((a, b) => a - b);
  let longestYearStreak = yearNums.length ? 1 : 0;
  let run = longestYearStreak;
  for (let i = 1; i < yearNums.length; i += 1) {
    run = yearNums[i] === (yearNums[i - 1] ?? 0) + 1 ? run + 1 : 1;
    if (run > longestYearStreak) longestYearStreak = run;
  }

  const firstAscent = ascents[0];
  const latestAscent = ascents[ascents.length - 1];
  const span =
    firstAscent && latestAscent
      ? Math.max(
          1,
          (new Date(latestAscent.ascent_date).getTime() - new Date(firstAscent.ascent_date).getTime()) /
            (365.25 * 24 * 3600 * 1000),
        )
      : 1;
  const daysSinceLast = latestAscent
    ? Math.max(0, Math.floor((Date.now() - new Date(`${latestAscent.ascent_date}T00:00:00`).getTime()) / 86400000))
    : undefined;

  const busiestMonthIndex = months.reduce((best, c, i) => (c > (months[best] ?? 0) ? i : best), 0);
  const xp = computeXp(input);

  return {
    total,
    uniquePeaks,
    repeats,
    mostRepeated,
    highPoints: [...creditedHighpointCountries(ascents)].filter(isUnCountry).length,

    famous: ascents.filter((a) => a.peak_type === "famous_peak").length,
    other: ascents.filter((a) => a.peak_type !== "country_highpoint" && a.peak_type !== "famous_peak").length,
    countries: countryCounts.size,
    topCountry: topCountryEntry ? { name: topCountryEntry[0], count: topCountryEntry[1] } : undefined,
    totalMetres,
    everests: totalMetres / 8849,
    highest,
    lowest,
    averageMetres: withElevation ? Math.round(totalMetres / withElevation) : 0,
    medianMetres: medianMetres ?? 0,
    withElevation,
    bands,
    seasons,
    months,
    busiestMonth: total ? { month: busiestMonthIndex, count: months[busiestMonthIndex] ?? 0 } : undefined,
    years,
    activeYears: years.length,
    perYear: total ? Math.round((total / span) * 10) / 10 : 0,
    bestYear,
    longestYearStreak,
    firstAscent,
    latestAscent,
    daysSinceLast,
    activeDays: dayCounts.size,
    bestDay: bestDayEntry ? { date: bestDayEntry[0], count: bestDayEntry[1] } : undefined,
    multiPeakDays: [...dayCounts.values()].filter((c) => c > 1).length,
    difficulty,
    hardest,
    withPhoto,
    withReport,
    withRoute,
    totalXp: xp.total,
    level: xp.level.level,
    levelTitle: xp.level.title,
  };
};

export const difficultyLabels: Record<Difficulty, string> = {
  very_easy: "Very easy",
  easy: "Easy",
  moderate: "Moderate",
  hard: "Hard",
  expert: "Expert",
};

export const difficultyOrder = DIFFS;
