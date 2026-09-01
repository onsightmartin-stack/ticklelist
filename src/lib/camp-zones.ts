/**
 * Base Camp is no longer a single valley: the world is a ring of screens you
 * can walk around forever. Step off the left edge and you arrive on the right
 * edge of the previous zone, and vice versa — like walking around a planet.
 */

export type CampZoneId =
  | "valley"
  | "glacier"
  | "deathZone"
  | "desert"
  | "mushroom"
  | "coldDesert"
  | "volcano"
  | "island";

export interface CampZone {
  id: CampZoneId;
  /** Short name shown in the HUD. */
  name: string;
  /** One-line flavour shown when you arrive. */
  blurb: string;
  /** Emoji marker for the compass strip. */
  icon: string;
  /** Only the home valley holds the community's climbers and shelters. */
  social: boolean;
}

export const campZones: CampZone[] = [
  {
    id: "valley",
    name: "Home Valley",
    blurb: "Tents, campfire and every Ticklelist climber.",
    icon: "🏕️",
    social: true,
  },
  {
    id: "glacier",
    name: "Glacier Basin",
    blurb: "Blue ice, seracs and a frozen lake. Mind the crevasses.",
    icon: "🧊",
    social: false,
  },
  {
    id: "deathZone",
    name: "The Death Zone",
    blurb: "8,000 m on a wind-scoured col. Altitude sickness is killing you — descend, or find oxygen.",
    icon: "☠️",
    social: false,
  },
  {
    id: "desert",
    name: "Desert Range",
    blurb: "Red rock, dunes and a palm-ringed oasis.",
    icon: "🏜️",
    social: false,
  },
  {
    id: "mushroom",
    name: "Fungal Hollow",
    blurb: "Giant glowing toadstools, fairy rings and drifting spores.",
    icon: "🍄",
    social: false,
  },
  {
    id: "coldDesert",
    name: "Grey Wastes",
    blurb: "A cold high desert of grey gravel under rugged Dolomite towers.",
    icon: "🪨",
    social: false,
  },
  {
    id: "volcano",
    name: "Ashfall Caldera",
    blurb: "Black ash, glowing lava rivers and a cone that never stops smoking.",
    icon: "🌋",
    social: false,
  },
  {
    id: "island",
    name: "Coral Cay",
    blurb: "A Caribbean islet: turquoise shallows, white sand and leaning palms.",
    icon: "🏝️",
    social: false,
  },
];

export const zoneAt = (index: number): CampZone =>
  campZones[((index % campZones.length) + campZones.length) % campZones.length]!;

/** Wrap a zone index onto the ring. */
export const wrapZone = (index: number) =>
  ((index % campZones.length) + campZones.length) % campZones.length;
