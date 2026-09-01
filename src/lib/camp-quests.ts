/**
 * Zone quests: every screen of the Base Camp ring world hides a handful of
 * collectible tokens. Walk your climber over one and it is picked up; gather
 * them all and the zone's quest is complete. Progress is purely local (saved
 * in localStorage) — it's a bit of fun, not a leaderboard.
 */

import type { CampZoneId } from "@/lib/camp-zones";
import { campSurfaceY } from "@/lib/camp-terrain";

export interface QuestToken {
  id: string;
  /** World-space position of the token. */
  x: number;
  y: number;
  /** Emoji drawn on the ground. */
  icon: string;
  /** Short label shown when picked up. */
  name: string;
  /** Token ids that must be collected first — locked until then. */
  requires?: string[];
  /** Shown when you stand on a locked token. */
  lockedHint?: string;
}

export interface ZoneQuest {
  id: string;
  zone: CampZoneId;
  title: string;
  brief: string;
  /** Line shown once every token is collected. */
  reward: string;
  /** Death Zone: nothing can be collected before the oxygen bottle is open. */
  requiresOxygen?: boolean;
  tokens: QuestToken[];
}

/** Summit y for a world x, nudged so the token sits on the crest. */
const summitY = (x: number) => campSurfaceY(x) - 4;



export const zoneQuests: ZoneQuest[] = [
  {
    id: "valley-firewood",
    zone: "valley",
    title: "Fire Duty",
    brief: "Collect 4 bundles of firewood so the camp fire burns all night.",
    reward: "The campfire roars — the alpacas approve. 🔥",
    tokens: [
      { id: "wood-1", x: 320, y: 792, icon: "🪵", name: "Dry birch" },
      { id: "wood-2", x: 690, y: 838, icon: "🪵", name: "Split pine" },
      { id: "wood-3", x: 1180, y: 780, icon: "🪵", name: "Storm-fallen spruce" },
      { id: "wood-4", x: 1520, y: 846, icon: "🔥", name: "Tinder bundle" },
    ],
  },
  {
    id: "glacier-ice-cores",
    zone: "glacier",
    title: "Ice Cores",
    brief: "Drill 4 ice cores from the basin without falling into a crevasse.",
    reward: "The cores are logged — 400 years of snowfall in a tube. 🧪",
    tokens: [
      { id: "core-1", x: 300, y: 800, icon: "🧊", name: "Blue ice core" },
      { id: "core-2", x: 740, y: 770, icon: "🧭", name: "Lost compass" },
      { id: "core-3", x: 1130, y: 842, icon: "🧊", name: "Serac shard" },
      { id: "core-4", x: 1560, y: 796, icon: "🪶", name: "Petrel feather" },
    ],
  },
  {
    id: "desert-water",
    zone: "desert",
    title: "Water Run",
    brief: "Fill 4 canteens at the oasis before the sun gets high.",
    reward: "Canteens full — the camels stop giving you that look. 🐫",
    tokens: [
      { id: "water-1", x: 360, y: 812, icon: "🫗", name: "Oasis canteen" },
      { id: "water-2", x: 780, y: 850, icon: "🌴", name: "Date bundle" },
      { id: "water-3", x: 1210, y: 786, icon: "🏺", name: "Buried amphora" },
      { id: "water-4", x: 1580, y: 838, icon: "🦂", name: "Scorpion charm" },
    ],
  },
  {
    id: "mushroom-spores",
    zone: "mushroom",
    title: "Spore Hunt",
    brief: "Gather 5 glowing spore caps for the hollow's lantern keeper.",
    reward: "The whole grove pulses violet in thanks. ✨🍄",
    tokens: [
      { id: "spore-1", x: 280, y: 806, icon: "🍄", name: "Glowcap" },
      { id: "spore-2", x: 620, y: 846, icon: "🍄‍🟫", name: "Moonshroom" },
      { id: "spore-3", x: 980, y: 776, icon: "✨", name: "Drifting spore" },
      { id: "spore-4", x: 1330, y: 840, icon: "🧚", name: "Sporeling friend" },
      { id: "spore-5", x: 1610, y: 800, icon: "🔮", name: "Fairy-ring stone" },
    ],
  },
  {
    id: "cold-desert-survey",
    zone: "coldDesert",
    title: "Tower Survey",
    brief: "Log 4 markers among the grey towers before the wind picks up.",
    reward: "The survey is filed — every spire has a name now. 🪨",
    tokens: [
      { id: "grey-1", x: 330, y: 798, icon: "🧗", name: "Old piton" },
      { id: "grey-2", x: 700, y: 844, icon: "🪨", name: "Frost-split boulder" },
      { id: "grey-3", x: 1150, y: 782, icon: "📐", name: "Survey marker" },
      { id: "grey-4", x: 1570, y: 836, icon: "🧤", name: "Lost glove" },
    ],
  },
  {
    id: "volcano-samples",
    zone: "volcano",
    title: "Hot Work",
    brief: "Grab 4 samples off the ash plain without cooking your boots.",
    reward: "Samples bagged — the caldera keeps its temper. 🌋",
    tokens: [
      { id: "lava-1", x: 300, y: 806, icon: "🪨", name: "Volcanic bomb" },
      { id: "lava-2", x: 690, y: 850, icon: "🧯", name: "Scorched kit bag" },
      { id: "lava-3", x: 1120, y: 780, icon: "🌋", name: "Fresh obsidian" },
      { id: "lava-4", x: 1540, y: 842, icon: "🌡️", name: "Vent thermometer" },
    ],
  },
  {
    id: "island-beachcomb",
    zone: "island",
    title: "Beachcombing",
    brief: "Comb the cay for 5 things the tide left behind.",
    reward: "The crabs let you keep every last one. 🏝️",
    tokens: [
      { id: "cay-1", x: 290, y: 812, icon: "🐚", name: "Conch shell" },
      { id: "cay-2", x: 640, y: 852, icon: "🥥", name: "Fallen coconut" },
      { id: "cay-3", x: 1000, y: 786, icon: "🍾", name: "Message in a bottle" },
      { id: "cay-4", x: 1360, y: 846, icon: "⭐", name: "Starfish" },
      { id: "cay-5", x: 1620, y: 804, icon: "🪸", name: "Coral fragment" },
    ],
  },
  {
    id: "death-zone-hillary-camera",
    zone: "deathZone",
    title: "Fix the Ropes",
    brief:
      "On oxygen only: pick up both rope coils on the col, fix them to the three summit anchors, then follow the fixed line to the lost camera.",
    reward: "The camera is yours — 1953's last frame, still in the barrel. 📷",
    requiresOxygen: true,
    tokens: [
      { id: "rope-1", x: 470, y: 836, icon: "🪢", name: "Coil of fixed rope" },
      { id: "rope-2", x: 980, y: 848, icon: "🧵", name: "Spare 9 mm line" },
      {
        id: "anchor-1",
        x: 160,
        y: summitY(160),
        icon: "⚓",
        name: "Ropes fixed — west summit",
        requires: ["rope-1", "rope-2"],
        lockedHint: "No rope, no anchor. Collect both coils down on the col first.",
      },
      {
        id: "anchor-2",
        x: 720,
        y: summitY(720),
        icon: "⚓",
        name: "Ropes fixed — centre summit",
        requires: ["rope-1", "rope-2"],
        lockedHint: "No rope, no anchor. Collect both coils down on the col first.",
      },
      {
        id: "anchor-3",
        x: 1340,
        y: summitY(1340),
        icon: "⚓",
        name: "Ropes fixed — east summit",
        requires: ["rope-1", "rope-2"],
        lockedHint: "No rope, no anchor. Collect both coils down on the col first.",
      },
      {
        id: "hillary-camera",
        x: 1720,
        y: summitY(1720),
        icon: "📷",
        name: "Edmund Hillary's camera",
        requires: ["anchor-1", "anchor-2", "anchor-3"],
        lockedHint: "Unroped ground. Fix all three summit anchors before you traverse out here.",
      },
    ],
  },
];



export const questForZone = (zone: CampZoneId) => zoneQuests.find((q) => q.zone === zone);

export const QUEST_STORAGE_KEY = "ticklelist-basecamp-quests";

/** How close (in world px) the climber must be to pick a token up. */
export const PICKUP_RADIUS = 78;

export const loadQuestProgress = (): Record<string, string[]> => {
  try {
    const raw = window.localStorage.getItem(QUEST_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string[]>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

export const saveQuestProgress = (progress: Record<string, string[]>) => {
  try {
    window.localStorage.setItem(QUEST_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    /* ignore full storage */
  }
};

/** A token can only be picked up once its prerequisites (and oxygen) are met. */
export const tokenUnlocked = (
  quest: ZoneQuest,
  token: QuestToken,
  collected: string[],
  hasOxygen: boolean,
) => {
  if (quest.requiresOxygen && !hasOxygen) return false;
  return (token.requires ?? []).every((id) => collected.includes(id));
};
