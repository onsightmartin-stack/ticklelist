import type { Badge } from "@/lib/badges";

/**
 * Honour badges — earned for the stories no counter can measure: rescues,
 * dangerous ground, and hard-won epics. Members claim them themselves
 * (honour system) and an admin can verify them later.
 */
export interface BonusTitleDef {
  id: string;
  title: string;
  /** What you have to have done to wear it. */
  criteria: string;
  group: string;
  /** Emoji shown on the badge. */
  icon: string;
  /** Rarity drives the badge colour. */
  rarity: "rare" | "epic" | "legendary";
}

export const bonusTitleDefs: BonusTitleDef[] = [
  // Rescue & good deeds
  { id: "mountain-rescuer", title: "Rescue Hero", criteria: "Helped save someone's life on a mountain.", group: "Rescue & good deeds", icon: "🚁", rarity: "legendary" },
  { id: "first-responder", title: "First Responder", criteria: "Gave first aid or shelter to a stranger in the field.", group: "Rescue & good deeds", icon: "⛑️", rarity: "epic" },
  { id: "turnaround-hero", title: "Selfless Summit", criteria: "Abandoned your own summit to help someone down.", group: "Rescue & good deeds", icon: "🔁", rarity: "epic" },
  { id: "trash-hauler", title: "Trash Hauler", criteria: "Carried other people's rubbish off a mountain.", group: "Rescue & good deeds", icon: "🗑️", rarity: "rare" },
  { id: "trail-builder", title: "Trail Angel", criteria: "Volunteered on trail work, a hut or a local rescue team.", group: "Rescue & good deeds", icon: "😇", rarity: "rare" },

  // Dangerous ground
  { id: "conflict-zone", title: "Daredevil", criteria: "Travelled through an active conflict zone or level-4 advisory country.", group: "Dangerous ground", icon: "☢️", rarity: "legendary" },
  { id: "minefield-margin", title: "Minefield Margins", criteria: "Climbed a peak in a mined or disputed border area — with local guidance.", group: "Dangerous ground", icon: "🚧", rarity: "legendary" },
  { id: "closed-border", title: "Border Runner", criteria: "Reached a high point that required a rare permit or a closed border crossing.", group: "Dangerous ground", icon: "🛂", rarity: "epic" },
  { id: "volcano-active", title: "Ash Breather", criteria: "Stood on an actively erupting or degassing volcano.", group: "Dangerous ground", icon: "🌋", rarity: "epic" },
  { id: "polar-night", title: "Polar Night Walker", criteria: "Travelled or climbed above the polar circle in full winter darkness.", group: "Dangerous ground", icon: "🌌", rarity: "epic" },
  { id: "shark-alley", title: "Beast Whisperer", criteria: "Survived a close encounter with a bear, big cat, shark or similar.", group: "Dangerous ground", icon: "🐻", rarity: "rare" },

  // Suffering & style
  { id: "storm-bivvy", title: "Storm Bivouac", criteria: "Spent an unplanned night out in a serious storm.", group: "Suffering & style", icon: "⛺", rarity: "epic" },
  { id: "self-rescue", title: "Self-Rescue", criteria: "Got yourself out of a crevasse, whiteout or benightment unaided.", group: "Suffering & style", icon: "🪢", rarity: "epic" },
  { id: "solo-summit", title: "Lone Wolf", criteria: "Completed a serious summit entirely solo.", group: "Suffering & style", icon: "🐺", rarity: "rare" },
  { id: "winter-ascent", title: "Winter Warrior", criteria: "A full winter ascent of a serious peak.", group: "Suffering & style", icon: "❄️", rarity: "rare" },
  { id: "no-oxygen", title: "Thin Air Purist", criteria: "Above 7000 m without supplementary oxygen.", group: "Suffering & style", icon: "🫁", rarity: "legendary" },
  { id: "human-powered", title: "Human Powered", criteria: "Reached a summit from your own front door without motors.", group: "Suffering & style", icon: "🚲", rarity: "epic" },
  { id: "onsight-solo", title: "Onsight Free Solo", criteria: "Free soloed a route onsight.", group: "Suffering & style", icon: "🧗", rarity: "legendary" },
  { id: "epic-fail", title: "Glorious Failure", criteria: "Turned around metres from the top because it was the right call.", group: "Suffering & style", icon: "🎗️", rarity: "rare" },
  { id: "type-two-fun", title: "Type Two Fun", criteria: "An adventure that was only enjoyable in hindsight.", group: "Suffering & style", icon: "🤣", rarity: "rare" },
];

export const bonusTitleById = (id: string) => bonusTitleDefs.find((t) => t.id === id);

export const rarityClass: Record<BonusTitleDef["rarity"], string> = {
  rare: "border-primary/40 bg-primary/5",
  epic: "border-accent/50 bg-accent/10",
  legendary: "border-destructive/50 bg-destructive/10",
};

export interface BonusTitleRow {
  id: string;
  user_id: string;
  title_id: string;
  story: string | null;
  happened_on: string | null;
  verified: boolean;
  created_at: string;
}

/** Turns claimed honour rows into badges for the badge grid. */
export type HonourBadge = Badge & { rarity: BonusTitleDef["rarity"]; verified: boolean; rowId: string };

export const honourBadges = (rows: BonusTitleRow[]): HonourBadge[] =>
  rows.flatMap((row) => {
    const def = bonusTitleById(row.title_id);
    if (!def) return [];
    const when = row.happened_on ? ` · ${row.happened_on}` : "";
    return [
      {
        id: `honour:${def.id}`,
        rowId: row.id,
        name: def.title,
        description: (row.story?.trim() || def.criteria) + when,
        icon: def.icon,
        earned: true,
        progress: 1,
        target: 1,
        rarity: def.rarity,
        verified: row.verified,
      },
    ];
  });
