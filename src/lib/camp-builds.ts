/**
 * Base Camp buildings. Every climber may keep one build standing in the camp,
 * unlocked by their climbing level — a bivy bag at level 2, a mountain
 * metropolis at level 100.
 */

export interface CampBuildKind {
  id: string;
  name: string;
  /** Climber level needed before it can be built. */
  minLevel: number;
  /** Short flavour line shown in the build menu. */
  blurb: string;
  /** Rough footprint in world pixels, used for the nameplate width. */
  width: number;
  /** Quest id that must be completed before this build unlocks. */
  requiresQuest?: string;
  /** Shown in the build menu while the quest is unfinished. */
  questHint?: string;
}

export const campBuilds: CampBuildKind[] = [
  {
    id: "campfire",
    name: "Camp fire",
    minLevel: 1,
    blurb: "Stacked logs, a good blaze and somewhere to dry socks.",
    width: 90,
    requiresQuest: "valley-firewood",
    questHint: "Finish the Fire Duty quest in the valley",
  },
  { id: "bivy", name: "Bivy bag", minLevel: 2, blurb: "A night out under the stars.", width: 70 },

  { id: "small_tent", name: "Small tent", minLevel: 5, blurb: "One-person nylon wedge.", width: 80 },
  { id: "big_tent", name: "Big tent", minLevel: 7, blurb: "Room for the whole rope team.", width: 110 },
  { id: "yurt", name: "Mongol yurt", minLevel: 10, blurb: "Felt walls, wood stove, steppe style.", width: 130 },
  { id: "tiny_hut", name: "Tiny hut", minLevel: 15, blurb: "Four walls and a tin roof.", width: 120 },
  { id: "medium_hut", name: "Medium hut", minLevel: 20, blurb: "Bunks, a stove and a drying room.", width: 160 },
  { id: "large_hut", name: "Large hut", minLevel: 25, blurb: "Warden, soup and forty beds.", width: 200 },
  { id: "lodge", name: "Alpine lodge", minLevel: 30, blurb: "Timber lodge with a sun terrace.", width: 240 },
  { id: "refuge", name: "Stone refuge", minLevel: 40, blurb: "Storm-proof walls on the moraine.", width: 260 },
  { id: "hamlet", name: "Mountain hamlet", minLevel: 50, blurb: "A handful of chalets and a chapel.", width: 320 },
  { id: "village", name: "Mountain village", minLevel: 60, blurb: "Bakery, gear shop, bell tower.", width: 380 },
  { id: "town", name: "Mountain town", minLevel: 70, blurb: "Cable car, hotels and a main street.", width: 440 },
  { id: "city", name: "Mountain city", minLevel: 80, blurb: "Fansipan-style temple city on the ridge.", width: 520 },
  { id: "megacity", name: "Metropol megacity", minLevel: 100, blurb: "Towers, sky bridges and neon.", width: 620 },
];

export const buildById = (id: string): CampBuildKind | undefined =>
  campBuilds.find((b) => b.id === id);

/** Is this build available to the climber right now? */
export const buildUnlocked = (
  kind: CampBuildKind,
  level: number,
  completedQuests: string[] = [],
): boolean =>
  level >= kind.minLevel &&
  (!kind.requiresQuest || completedQuests.includes(kind.requiresQuest));

/** The best build a climber of this level may put up. */
export const bestBuildFor = (level: number): CampBuildKind | null =>
  [...campBuilds].reverse().find((b) => !b.requiresQuest && level >= b.minLevel) ?? null;

/** Next build still locked at this level, if any. */
export const nextBuildFor = (level: number): CampBuildKind | null =>
  campBuilds.find((b) => !b.requiresQuest && level < b.minLevel) ?? null;


/** A sensible default nameplate, e.g. "Martin's hut". */
export const defaultLabel = (displayName: string, kind: CampBuildKind): string => {
  const first = displayName.trim().split(/\s+/)[0] ?? "Climber";
  const possessive = first.endsWith("s") ? `${first}'` : `${first}'s`;
  const noun = kind.name.toLowerCase().replace("mongol ", "").replace("mountain ", "");
  return `${possessive} ${noun}`;
};

/** Where a build may stand: the meadow strip in front of the ridges. */
export const CAMP_GROUND = { minX: 140, maxX: 1660, minY: 700, maxY: 860 };
