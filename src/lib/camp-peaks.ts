/**
 * Named summits for the Base Camp ring-world.
 *
 * Every zone's skyline has seven crests — four on the far ridge and three on
 * the walkable mid ridge (see BaseCampScene / camp-terrain). Each one gets a
 * silly-but-plausible name and an altitude, drawn as a small label above the
 * crest so the world reads like a real range instead of grey triangles.
 */

import type { CampZoneId } from "@/lib/camp-zones";

export interface CampPeak {
  /** Horizontal position as a fraction of the scene width. */
  fx: number;
  /** Crest y in scene units (label is drawn above this). */
  y: number;
  name: string;
  /** Metres. */
  alt: number;
}

/** Far ridge crests (background, higher and hazier). */
const FAR: Array<Pick<CampPeak, "fx" | "y">> = [
  { fx: 0.08, y: 300 },
  { fx: 0.28, y: 250 },
  { fx: 0.52, y: 280 },
  { fx: 0.76, y: 260 },
];

/** Mid ridge crests (the walkable skyline). */
const MID: Array<Pick<CampPeak, "fx" | "y">> = [
  { fx: 0.13, y: 420 },
  { fx: 0.41, y: 400 },
  { fx: 0.72, y: 430 },
];

type Named = [name: string, alt: number];

const NAMES: Record<CampZoneId, { far: Named[]; mid: Named[] }> = {
  valley: {
    far: [
      ["Tickle Peak", 3412],
      ["Mount Faffabout", 3890],
      ["Grand Dawdle", 3655],
      ["Snoozehorn", 3744],
    ],
    mid: [
      ["Wee Nubbin", 2180],
      ["Alpaca Tooth", 2465],
      ["Hammock Hump", 2094],
    ],
  },
  glacier: {
    far: [
      ["Mount Chatterjaw", 4120],
      ["Frostticklen", 4488],
      ["The Brainfreeze", 4260],
      ["Popsicle Spire", 4377],
    ],
    mid: [
      ["Crevasse Knuckle", 3110],
      ["Igloo Dome", 3288],
      ["Squeaky Snow Cap", 2975],
    ],
  },
  deathZone: {
    far: [
      ["Hillary's Hat", 8611],
      ["Mount Wheezemore", 8848],
      ["The Big Gasp", 8516],
      ["Serac Sundae", 8188],
    ],
    mid: [
      ["Anchor One", 7962],
      ["Rope Fixer's Nose", 8035],
      ["Last Bottle Buttress", 7884],
    ],
  },
  desert: {
    far: [
      ["Mount Parchmore", 2410],
      ["Cactus Crown", 2688],
      ["The Thirstpost", 2530],
      ["Sizzle Spire", 2602],
    ],
    mid: [
      ["Well Digger's Bump", 1440],
      ["Mirage Mesa", 1622],
      ["Sandy Toe", 1298],
    ],
  },
  mushroom: {
    far: [
      ["Mount Wobblecap", 1988],
      ["Great Googlyhorn", 2244],
      ["Spore Spire", 2107],
      ["Giggle Tor", 2166],
    ],
    mid: [
      ["Toadstool Knoll", 1240],
      ["Squishy Summit", 1388],
      ["Truffle Tump", 1122],
    ],
  },
  coldDesert: {
    far: [
      ["Mount Bleakabit", 5240],
      ["Grey Grumble", 5566],
      ["The Windscour", 5388],
      ["Ashen Fang", 5461],
    ],
    mid: [
      ["Pebble Pinnacle", 4180],
      ["Spire of Sighs", 4402],
      ["Dusty Dome", 4055],
    ],
  },
  volcano: {
    far: [
      ["Mount Grumblesmoke", 3760],
      ["Caldera Crown", 4022],
      ["The Sneezing Cone", 3841],
      ["Ember Ear", 3908],
    ],
    mid: [
      ["Cinder Snout", 2610],
      ["Lava Loaf", 2844],
      ["Warm Wart", 2487],
    ],
  },
  island: {
    far: [
      ["Mount Sunburn", 942],
      ["Coconut Crag", 1188],
      ["The Salty Spike", 1024],
      ["Reefhorn", 1096],
    ],
    mid: [
      ["Palm Pimple", 520],
      ["Hammock High Point", 648],
      ["Barnacle Bump", 401],
    ],
  },
};

/** Every named crest of a zone, far ridge first. */
export const campPeaks = (zone: CampZoneId): CampPeak[] => {
  const set = NAMES[zone] ?? NAMES.valley;
  return [
    ...FAR.map((c, i) => ({ ...c, name: set.far[i]![0], alt: set.far[i]![1] })),
    ...MID.map((c, i) => ({ ...c, name: set.mid[i]![0], alt: set.mid[i]![1] })),
  ];
};

/** "3,412 m" */
export const formatCampAlt = (alt: number) => `${alt.toLocaleString("en-US")} m`;
