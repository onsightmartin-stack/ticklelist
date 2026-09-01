import { countries } from "@/data/countries";

/**
 * Member-chosen definitions for contested challenges. Everyone counts "the
 * countries" and "the Seven Summits" slightly differently, so the tally on a
 * profile follows the definition the member picked. Stored per device.
 */

export type CountryDefinitionId =
  | "un"
  | "un-antarctica"
  | "un-vatican"
  | "un-antarctica-vatican"
  | "martin"
  | "gilbertson"
  | "everything"
  /** A member-built preset stored on this device. */
  | `custom:${string}`;

export type SevenSummitsId = "bass" | "messner" | "either" | "both";

/** How to treat countries whose official high point sits on an overseas island. */
export type TerritoryRuleId = "official" | "mainland" | "either";

export interface Definitions {
  countries: CountryDefinitionId;
  sevenSummits: SevenSummitsId;
  territories: TerritoryRuleId;
}

export const defaultDefinitions: Definitions = {
  countries: "martin",
  sevenSummits: "either",
  territories: "official",
};

const unCountries = countries
  .filter((c) => c.unMember !== false && c.country !== "Antarctica")
  .map((c) => c.country);

/** Non-UN entries that some definitions add on top of the 193 UN members. */
const extras = {
  antarctica: ["Antarctica"],
  taiwan: ["Taiwan"],
  vatican: ["Vatican City"],
  palestine: ["Palestine"],
  kosovo: ["Kosovo"],
};

export interface CountryDefinition {
  id: CountryDefinitionId;
  name: string;
  blurb: string;
  extras: string[];
}

export const countryDefinitions: CountryDefinition[] = [
  {
    id: "un",
    name: "UN member states only",
    blurb: "The 193 members of the United Nations. Nothing else counts.",
    extras: [],
  },
  {
    id: "un-antarctica",
    name: "UN + Antarctica",
    blurb: "The 193 UN members plus Vinson Massif — every piece of land on Earth, no observers.",
    extras: [...extras.antarctica],
  },
  {
    id: "un-vatican",
    name: "UN + Vatican City",
    blurb: "The 193 UN members plus the Holy See, the classic 194th country.",
    extras: [...extras.vatican],
  },
  {
    id: "un-antarctica-vatican",
    name: "UN + Antarctica + Vatican",
    blurb: "The 193 UN members, the Vatican and Antarctica.",
    extras: [...extras.antarctica, ...extras.vatican],
  },
  {
    id: "martin",
    name: "Onsight Martin (UN + Taiwan + Antarctica)",
    blurb:
      "Martin's mission definition: the 193 UN members plus Taiwan and Antarctica. The Vatican doesn't count.",
    extras: [...extras.antarctica, ...extras.taiwan],
  },
  {
    id: "gilbertson",
    name: "Gilbertson style (UN + observers + de facto states)",
    blurb:
      "The wide list Eric Gilbertson chases: UN members plus the Vatican, Palestine, Taiwan, Kosovo and Antarctica.",
    extras: [
      ...extras.antarctica,
      ...extras.taiwan,
      ...extras.vatican,
      ...extras.palestine,
      ...extras.kosovo,
    ],
  },
  {
    id: "everything",
    name: "Every high point in the catalog",
    blurb: "Anything Ticklelist tracks as a country high point, territories and disputed states included.",
    extras: [
      ...extras.antarctica,
      ...extras.taiwan,
      ...extras.vatican,
      ...extras.palestine,
      ...extras.kosovo,
    ],
  },
];

export interface SevenSummitsDefinition {
  id: SevenSummitsId;
  name: string;
  blurb: string;
}

export const sevenSummitsDefinitions: SevenSummitsDefinition[] = [
  { id: "bass", name: "Bass list", blurb: "Kosciuszko is Oceania's summit — the original list." },
  { id: "messner", name: "Messner list", blurb: "Carstensz Pyramid replaces Kosciuszko — the harder list." },
  {
    id: "either",
    name: "Either counts (7 summits)",
    blurb: "Kosciuszko or Carstensz ticks the seventh box, whichever you climbed.",
  },
  {
    id: "both",
    name: "Both (8 summits)",
    blurb: "The completist route — Kosciuszko and Carstensz both required.",
  },
];

export interface TerritoryRuleDefinition {
  id: TerritoryRuleId;
  name: string;
  blurb: string;
}

export const territoryRules: TerritoryRuleDefinition[] = [
  {
    id: "official",
    name: "Official high point (territories count)",
    blurb:
      "The true highest point of the sovereign state — Mount Paget on South Georgia for the UK, Teide for Spain, Mount Scenery for the Netherlands. Ben Nevis alone doesn't tick the UK.",
  },
  {
    id: "mainland",
    name: "Mainland only",
    blurb:
      "The home-territory summit is the country high point — Ben Nevis for the UK, Mulhacén for Spain, Vaalserberg for the Netherlands. Far-flung island summits don't tick the country.",
  },
  {
    id: "either",
    name: "Either counts",
    blurb: "Mainland or overseas — whichever of the two you climbed ticks the country off.",
  },
];

/**
 * A member-built country definition: a preset base list, plus countries they
 * add or drop, plus any extra peaks they want counted alongside.
 */
export interface CustomPreset {
  id: string;
  name: string;
  /** Built-in definition the preset starts from. */
  base: Exclude<CountryDefinitionId, `custom:${string}`>;
  /** Countries added on top of the base list. */
  include: string[];
  /** Countries removed from the base list. */
  exclude: string[];
  /** Extra peak catalog keys (`fp:Peak`) that count as their own box. */
  peaks: string[];
}

const PRESETS_KEY = "tl:definition-presets";

let presets: CustomPreset[] = [];

const sanitizePreset = (raw: Partial<CustomPreset>): CustomPreset | null => {
  if (!raw || typeof raw.id !== "string" || typeof raw.name !== "string") return null;
  const base = countryDefinitions.some((d) => d.id === raw.base)
    ? (raw.base as CustomPreset["base"])
    : "un";
  const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  return {
    id: raw.id,
    name: raw.name.slice(0, 60),
    base,
    include: list(raw.include),
    exclude: list(raw.exclude),
    peaks: list(raw.peaks),
  };
};

const readPresets = (): CustomPreset[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PRESETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<CustomPreset>[];
    return Array.isArray(parsed)
      ? parsed.map(sanitizePreset).filter((p): p is CustomPreset => p !== null)
      : [];
  } catch {
    return [];
  }
};

/** Every preset saved on this device. */
export const listPresets = (): CustomPreset[] => presets;

export const findPreset = (id: string | null | undefined): CustomPreset | null =>
  presets.find((p) => `custom:${p.id}` === id || p.id === id) ?? null;

const writePresets = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event(EVENT));
};

/** Creates or updates a preset and returns it. */
export const savePreset = (preset: Omit<CustomPreset, "id"> & { id?: string }): CustomPreset => {
  const id = preset.id ?? `p${Date.now().toString(36)}`;
  const clean = sanitizePreset({ ...preset, id })!;
  const at = presets.findIndex((p) => p.id === id);
  if (at >= 0) presets[at] = clean;
  else presets = [...presets, clean];
  writePresets();
  return clean;
};

export const deletePreset = (id: string) => {
  presets = presets.filter((p) => p.id !== id);
  if (current.countries === `custom:${id}`) {
    current = { ...current, countries: defaultDefinitions.countries };
    persistDefinitions();
  }
  writePresets();
};

/** Country names counting as a high-point tick under a definition. */
export const countrySetFor = (id: CountryDefinitionId): Set<string> => {
  if (typeof id === "string" && id.startsWith("custom:")) {
    const preset = findPreset(id);
    if (!preset) return new Set(unCountries);
    const set = countrySetFor(preset.base);
    preset.include.forEach((c) => set.add(c));
    preset.exclude.forEach((c) => set.delete(c));
    return set;
  }
  const def = countryDefinitions.find((d) => d.id === id);
  return new Set([...unCountries, ...(def?.extras ?? [])]);
};

/** Display name of any definition, built-in or custom. */
export const countryDefinitionName = (id: CountryDefinitionId): string =>
  findPreset(id)?.name ?? countryDefinitions.find((d) => d.id === id)?.name ?? "Custom";

/** Extra peaks the active definition counts alongside the countries. */
export const activeExtraPeaks = (): string[] => findPreset(current.countries)?.peaks ?? [];

const STORAGE_KEY = "tl:definitions";
const EVENT = "tl:definitions-changed";

let current: Definitions = { ...defaultDefinitions };

const read = (): Definitions => {
  if (typeof window === "undefined") return { ...defaultDefinitions };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultDefinitions };
    const parsed = JSON.parse(raw) as Partial<Definitions>;
    return {
      countries:
        countryDefinitions.some((d) => d.id === parsed.countries) ||
        (typeof parsed.countries === "string" && parsed.countries.startsWith("custom:"))
          ? (parsed.countries as CountryDefinitionId)
          : defaultDefinitions.countries,
      sevenSummits: sevenSummitsDefinitions.some((d) => d.id === parsed.sevenSummits)
        ? (parsed.sevenSummits as SevenSummitsId)
        : defaultDefinitions.sevenSummits,
      territories: territoryRules.some((d) => d.id === parsed.territories)
        ? (parsed.territories as TerritoryRuleId)
        : defaultDefinitions.territories,
    };
  } catch {
    return { ...defaultDefinitions };
  }
};

if (typeof window !== "undefined") {
  presets = readPresets();
  current = read();
}

/** The definitions in force right now (safe to call from plain functions). */
export const getDefinitions = (): Definitions => current;

/** The mainland/territory rule in force right now. */
export const activeTerritoryRule = (): TerritoryRuleId => current.territories;

/** The country set in force right now. */
export const activeCountrySet = () => countrySetFor(current.countries);

function persistDefinitions() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    /* storage unavailable */
  }
}

export const setDefinitions = (next: Partial<Definitions>) => {
  current = { ...current, ...next };
  if (typeof window === "undefined") return;
  persistDefinitions();
  window.dispatchEvent(new Event(EVENT));
};

/** Re-reads presets from storage (used on hydration). */
export const reloadPresets = () => {
  presets = readPresets();
};

export const DEFINITIONS_EVENT = EVENT;
export const readStoredDefinitions = read;
