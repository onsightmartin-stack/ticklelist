/**
 * Base Camp inventory: Minecraft-style loot a climber earns for completing
 * challenge / peak lists (and a few career milestones). Purely derived from the
 * member's logged ascents, so nothing extra needs storing.
 */
import { peakLists } from "@/data/peak-lists";
import { countsAsCountryHighpoint, highpointCreditKey } from "@/lib/historic-highpoints";

export interface InventoryItem {
  id: string;
  name: string;
  /** Emoji used as the item sprite in the slot grid. */
  emoji: string;
  hint: string;
  earned: boolean;
  done: number;
  total: number;
}

interface AscentLike {
  peak_name: string;
  peak_type: string;
  country?: string | null;
  ascent_date?: string | null;
}

const emojiFor = (category: string, done: number, total: number) => {
  if (category === "Extreme") return done >= total ? "👑" : "🏔️";
  if (category === "Volcanic") return done >= total ? "🌋" : "🔥";
  if (category === "Regional") return done >= total ? "🧭" : "🗺️";
  return done >= total ? "🏆" : "🥾";
};

/** Keys of everything a member has ticked, in peak-catalog key form. */
export const tickedKeys = (ascents: AscentLike[]): Set<string> => {
  const set = new Set<string>();
  for (const a of ascents) {
    set.add(highpointCreditKey(a));
  }
  return set;
};

/** One item per challenge list, plus career milestones. */
export const buildInventory = (ascents: AscentLike[]): InventoryItem[] => {
  const keys = tickedKeys(ascents);

  const listItems: InventoryItem[] = peakLists.map((list) => {
    const done = list.entries.filter(
      (e) => keys.has(e.key) || (e.alt ?? []).some((k) => keys.has(k)),
    ).length;
    const total = list.entries.length;
    return {
      id: `list:${list.id}`,
      name: list.name,
      emoji: emojiFor(list.category, done, total),
      hint: done >= total ? "List completed — trophy earned" : `${done}/${total} ticked`,
      earned: total > 0 && done >= total,
      done,
      total,
    };
  });

  const uniquePeaks = new Set(ascents.map((a) => a.peak_name)).size;
  const countries = new Set(ascents.map((a) => a.country).filter(Boolean)).size;

  const milestone = (
    id: string,
    name: string,
    emoji: string,
    done: number,
    total: number,
    unit: string,
  ): InventoryItem => ({
    id,
    name,
    emoji,
    hint: done >= total ? "Earned" : `${done}/${total} ${unit}`,
    earned: done >= total,
    done: Math.min(done, total),
    total,
  });

  return [
    milestone("gear:boots", "Worn-in boots", "🥾", uniquePeaks, 10, "peaks"),
    milestone("gear:rope", "Climbing rope", "🪢", uniquePeaks, 25, "peaks"),
    milestone("gear:axe", "Ice axe", "🪓", uniquePeaks, 50, "peaks"),
    milestone("gear:tent", "Storm tent", "⛺", uniquePeaks, 100, "peaks"),
    milestone("gear:passport", "Stamped passport", "🛂", countries, 5, "countries"),
    milestone("gear:globe", "Globetrotter globe", "🌍", countries, 20, "countries"),
    milestone("gear:compass", "Brass compass", "🧭", countries, 40, "countries"),
    ...listItems,
  ];
};
