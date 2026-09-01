import { countries } from "@/data/countries";
import { peakLists } from "@/data/peak-lists";
import { adventureChallenges } from "@/data/adventure-challenges";
import type { Ascent } from "@/lib/peak-catalog";
import type { Visit } from "@/data/places";
import { highpointCreditKey } from "@/lib/historic-highpoints";
import { creditedHighpointCountries } from "@/lib/mainland-credit";
import {
  activeCountrySet,
  activeExtraPeaks,
  countryDefinitionName,
  getDefinitions,
  sevenSummitsDefinitions,
} from "@/lib/definitions";

/** The Seven Summits roster under the member's chosen definition. */
export function sevenSummitEntries(): { key: string; alt?: string[] }[] {
  const bass = peakLists.find((l) => l.id === "seven-summits-bass")?.entries ?? [];
  const messner = peakLists.find((l) => l.id === "seven-summits-messner")?.entries ?? [];
  const mode = getDefinitions().sevenSummits;
  if (mode === "bass") return bass;
  if (mode === "messner") return messner;
  const kosciuszko = bass[bass.length - 1];
  const carstensz = messner[messner.length - 1];
  const shared = bass.slice(0, -1);
  if (mode === "both") return [...shared, ...(kosciuszko ? [kosciuszko] : []), ...(carstensz ? [carstensz] : [])];
  // "either" — one seventh box, ticked by whichever of the two you climbed.
  return [
    ...shared,
    {
      key: kosciuszko?.key ?? "fp:Kosciuszko",
      alt: [...(kosciuszko?.alt ?? []), ...(carstensz ? [carstensz.key, ...(carstensz.alt ?? [])] : [])],
    },
  ];
}

export interface GoalProgress {
  id: string;
  label: string;
  short: string;
  done: number;
  total: number | null;
}

export interface GoalDef {
  id: string;
  label: string;
  /** Compact label used inside the small profile boxes. */
  short: string;
  group: string;
}

const allHighpointCountries = countries.filter((c) => c.country !== "Antarctica");

/**
 * True when the country counts under the member's chosen country definition
 * (UN only, UN + Taiwan + Antarctica, Gilbertson style, …).
 */
export const isUnCountry = (country: string | null | undefined) =>
  !!country && activeCountrySet().has(country);

/** Every goal a member can pin to their profile. */
export const goalDefs: GoalDef[] = [
  { id: "total-ascents", label: "Total ascents", short: "Ascents", group: "Basics" },
  { id: "unique-peaks", label: "Unique peaks", short: "Unique peaks", group: "Basics" },
  { id: "countries-climbed", label: "Countries climbed in", short: "Countries climbed", group: "Basics" },
  { id: "countries-visited", label: "Countries visited", short: "Countries visited", group: "Basics" },
  { id: "places-visited", label: "Places visited", short: "Places", group: "Basics" },
  { id: "continents", label: "Continents", short: "Continents", group: "Basics" },
  { id: "un-highpoints", label: "Country high points", short: "Country high points", group: "High points" },
  { id: "seven-summits", label: "Seven Summits", short: "Seven Summits", group: "High points" },
  {
    id: "all-highpoints",
    label: `Country high points (all ${allHighpointCountries.length})`,
    short: "All high points",
    group: "High points",
  },
  ...peakLists.map((l) => ({ id: `list:${l.id}`, label: l.name, short: l.name, group: `Lists · ${l.category}` })),
  ...adventureChallenges.map((c) => ({
    id: `challenge:${c.id}`,
    label: c.name,
    short: c.name,
    group: "Challenges",
  })),
];

export const defaultGoals = ["un-highpoints", "total-ascents", "countries-visited", "seven-summits"];

const continentOf = (country: string | null | undefined) =>
  country ? countries.find((c) => c.country === country)?.continent ?? null : null;

/** Computes progress for every selected goal id from a member's logbooks. */
export function computeGoals(ids: string[], ascents: Ascent[], visits: Visit[]): GoalProgress[] {
  const peakKeys = new Set<string>();
  ascents.forEach((a) =>
    peakKeys.add(highpointCreditKey(a)),
  );
  const placeKeys = new Set(visits.map((v) => v.place_key));

  const hpCountries = creditedHighpointCountries(ascents);
  const unCountries = activeCountrySet();
  const unDone = [...hpCountries].filter((c) => unCountries.has(c)).length;

  const continentsSet = new Set<string>();
  visits.forEach((v) => {
    const c = continentOf(v.country);
    if (c) continentsSet.add(c);
    if (v.place_type === "pole" && v.place_name !== "North Pole") continentsSet.add("Antarctica");
  });
  ascents.forEach((a) => {
    const c = continentOf(a.country);
    if (c) continentsSet.add(c);
  });

  const one = (id: string): GoalProgress | null => {
    const def = goalDefs.find((g) => g.id === id);
    if (!def) return null;
    const base = { id, label: def.label, short: def.short };
    if (id === "un-highpoints") {
      base.label = `Country high points — ${countryDefinitionName(getDefinitions().countries)}`;
    }
    if (id === "seven-summits") {
      const sd = sevenSummitsDefinitions.find((d) => d.id === getDefinitions().sevenSummits);
      if (sd) base.label = `Seven Summits — ${sd.name}`;
    }

    if (id.startsWith("list:")) {
      const list = peakLists.find((l) => l.id === id.slice(5));
      if (!list) return null;
      const done = list.entries.filter(
        (e) => peakKeys.has(e.key) || (e.alt ?? []).some((k) => peakKeys.has(k)),
      ).length;
      return { ...base, done, total: list.entries.length };
    }

    if (id.startsWith("challenge:")) {
      const ch = adventureChallenges.find((c) => c.id === id.slice(10));
      if (!ch) return null;
      if (ch.id === "seven-continents") {
        return { ...base, done: continentsSet.size, total: 7 };
      }
      const peaks = ch.peaks ?? [];
      const places = ch.places ?? [];
      const done =
        peaks.filter((p) => peakKeys.has(p.key) || (p.alt ?? []).some((k) => peakKeys.has(k))).length +
        places.filter((k) => placeKeys.has(k)).length;
      return { ...base, done, total: peaks.length + places.length };
    }

    switch (id) {
      case "total-ascents":
        return { ...base, done: ascents.length, total: null };
      case "unique-peaks":
        return {
          ...base,
          done: new Set(ascents.map((a) => a.peak_name.trim().toLowerCase())).size,
          total: null,
        };
      case "countries-climbed":
        return { ...base, done: new Set(ascents.map((a) => a.country).filter(Boolean)).size, total: null };
      case "countries-visited":
        return {
          ...base,
          done: new Set(visits.filter((v) => v.place_type === "country").map((v) => v.place_key)).size,
          total: allHighpointCountries.length,
        };
      case "places-visited":
        return { ...base, done: visits.filter((v) => v.place_type !== "country").length, total: null };
      case "continents":
        return { ...base, done: continentsSet.size, total: 7 };
      case "un-highpoints": {
        const extras = activeExtraPeaks();
        return {
          ...base,
          done: unDone + extras.filter((k) => peakKeys.has(k)).length,
          total: unCountries.size + extras.length,
        };
      }
      case "seven-summits": {
        const entries = sevenSummitEntries();
        const done = entries.filter(
          (e) => peakKeys.has(e.key) || (e.alt ?? []).some((k) => peakKeys.has(k)),
        ).length;
        return { ...base, done, total: entries.length };
      }
      case "all-highpoints":
        return { ...base, done: hpCountries.size, total: allHighpointCountries.length };
      default:
        return null;
    }
  };

  return ids.map(one).filter((g): g is GoalProgress => g !== null);
}

export const MAX_PROFILE_GOALS = 4;

export interface GoalItem {
  key: string;
  label: string;
  done: boolean;
}

const prettyKey = (key: string) => key.replace(/^(hp|fp|pl|co):/, "");

/** Keys of everything a member has ticked, used to check list entries. */
function tickedKeys(ascents: Ascent[], visits: Visit[]) {
  const peakKeys = new Set<string>();
  ascents.forEach((a) =>
    peakKeys.add(highpointCreditKey(a)),
  );
  const placeKeys = new Set(visits.map((v) => v.place_key));
  return { peakKeys, placeKeys };
}

/**
 * The individual entries behind a goal with a fixed roster (lists, challenges,
 * high points, continents). Returns null for open-ended counters.
 */
export function goalItems(id: string, ascents: Ascent[], visits: Visit[]): GoalItem[] | null {
  const { peakKeys, placeKeys } = tickedKeys(ascents, visits);
  const hit = (key: string, alt?: string[]) =>
    peakKeys.has(key) || placeKeys.has(key) || (alt ?? []).some((k) => peakKeys.has(k) || placeKeys.has(k));

  if (id.startsWith("list:")) {
    const list = peakLists.find((l) => l.id === id.slice(5));
    if (!list) return null;
    return list.entries.map((e) => ({ key: e.key, label: prettyKey(e.key), done: hit(e.key, e.alt) }));
  }

  if (id.startsWith("challenge:")) {
    const ch = adventureChallenges.find((c) => c.id === id.slice(10));
    if (!ch) return null;
    if (ch.id === "seven-continents") return continentItems(ascents, visits);
    return [
      ...(ch.peaks ?? []).map((p) => ({ key: p.key, label: prettyKey(p.key), done: hit(p.key, p.alt) })),
      ...(ch.places ?? []).map((k) => ({ key: k, label: prettyKey(k), done: placeKeys.has(k) })),
    ];
  }

  const hpCountries = creditedHighpointCountries(ascents);

  switch (id) {
    case "seven-summits":
      return sevenSummitEntries().map((e) => ({
        key: e.key,
        label: prettyKey(e.key),
        done: peakKeys.has(e.key) || (e.alt ?? []).some((k) => peakKeys.has(k)),
      }));
    case "un-highpoints":
      return [
        ...[...activeCountrySet()]
          .sort()
          .map((c) => ({ key: `hp:${c}`, label: c, done: hpCountries.has(c) })),
        ...activeExtraPeaks().map((k) => ({ key: k, label: prettyKey(k), done: peakKeys.has(k) })),
      ];
    case "all-highpoints":
      return allHighpointCountries
        .map((c) => ({ key: `hp:${c.country}`, label: c.country, done: hpCountries.has(c.country) }))
        .sort((a, b) => a.label.localeCompare(b.label));
    case "countries-visited": {
      const visited = new Set(visits.filter((v) => v.place_type === "country").map((v) => v.place_key));
      return allHighpointCountries
        .map((c) => ({ key: `co:${c.country}`, label: c.country, done: visited.has(`co:${c.country}`) }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }
    case "continents":
      return continentItems(ascents, visits);
    default:
      return null;
  }
}

const allContinents = ["Africa", "Antarctica", "Asia", "Europe", "North America", "Oceania", "South America"];

function continentItems(ascents: Ascent[], visits: Visit[]): GoalItem[] {
  const set = new Set<string>();
  visits.forEach((v) => {
    const c = continentOf(v.country);
    if (c) set.add(c);
    if (v.place_type === "pole" && v.place_name !== "North Pole") set.add("Antarctica");
  });
  ascents.forEach((a) => {
    const c = continentOf(a.country);
    if (c) set.add(c);
  });
  return allContinents.map((c) => ({ key: `continent:${c}`, label: c, done: set.has(c) }));
}


/**
 * Picks up to `MAX_PROFILE_GOALS` goals that best fit a member's logbooks:
 * goals already underway and within reach, kept diverse across groups.
 */
export function suggestGoals(ascents: Ascent[], visits: Visit[]): string[] {
  const ids = goalDefs.map((g) => g.id);
  const progress = computeGoals(ids, ascents, visits);
  const groupOf = new Map(goalDefs.map((g) => [g.id, g.group]));

  const scored = progress
    .map((p) => {
      // Open-ended counters (no total) are useful headline boxes once there is data.
      if (p.total === null) return { id: p.id, score: p.done > 0 ? 0.55 + Math.min(p.done, 50) / 500 : 0.1 };
      if (p.total === 0) return { id: p.id, score: 0 };
      const ratio = p.done / p.total;
      if (ratio >= 1) return { id: p.id, score: 0.3 }; // finished — nice to show, but not a goal
      if (p.done === 0) return { id: p.id, score: 0.05 };
      // Sweet spot: real progress, still something left to chase. Small lists rank higher.
      const reach = 1 - Math.abs(ratio - 0.55);
      const size = 1 / (1 + Math.log10(p.total + 1));
      return { id: p.id, score: 0.6 + reach * 0.5 + size * 0.3 };
    })
    .sort((a, b) => b.score - a.score);

  const picked: string[] = [];
  const perGroup = new Map<string, number>();
  for (const s of scored) {
    if (picked.length >= MAX_PROFILE_GOALS) break;
    if (s.score <= 0.1) continue;
    const group = groupOf.get(s.id) ?? "";
    const used = perGroup.get(group) ?? 0;
    if (used >= 2) continue;
    perGroup.set(group, used + 1);
    picked.push(s.id);
  }
  return picked.length ? picked : defaultGoals.slice(0, MAX_PROFILE_GOALS);
}
