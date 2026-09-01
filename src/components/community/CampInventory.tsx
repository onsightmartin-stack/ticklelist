import { useState } from "react";
import { X } from "lucide-react";
import type { InventoryItem } from "@/lib/camp-inventory";

interface Props {
  items: InventoryItem[];
  onClose: () => void;
}

/**
 * Minecraft-style inventory: a grid of chunky slots. Earned loot shows its
 * sprite, everything else is a shadowed silhouette with its progress.
 */
const CampInventory = ({ items, onClose }: Props) => {
  const [picked, setPicked] = useState<InventoryItem | null>(null);
  const earned = items.filter((i) => i.earned).length;

  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-xl rounded-xl border-4 border-slate-600 bg-slate-800/95 p-3 shadow-2xl">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-display text-sm tracking-[0.2em] text-slate-100 uppercase">
            Inventory · {earned}/{items.length}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close inventory"
            className="grid h-8 w-8 place-items-center rounded-md border border-slate-500 bg-slate-700 text-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid max-h-[42vh] grid-cols-6 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-8">
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => setPicked(it)}
              title={`${it.name} — ${it.hint}`}
              aria-label={`${it.name}, ${it.hint}`}
              className={`relative grid aspect-square place-items-center rounded-md border-2 text-xl transition-colors ${
                it.earned
                  ? "border-amber-300/70 bg-slate-700 hover:bg-slate-600"
                  : "border-slate-600 bg-slate-900/70 hover:bg-slate-800"
              }`}
            >
              <span className={it.earned ? "" : "opacity-25 grayscale"}>{it.emoji}</span>
              {!it.earned && it.total > 0 && (
                <span className="absolute inset-x-0 bottom-0 h-1 rounded-b bg-slate-700">
                  <span
                    className="block h-1 rounded-b bg-primary"
                    style={{ width: `${Math.min(100, (it.done / it.total) * 100)}%` }}
                  />
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-2 min-h-[2.5rem] rounded-md border border-slate-600 bg-slate-900/80 p-2 text-xs text-slate-200">
          {picked ? (
            <>
              <span className="font-display tracking-wider">{picked.emoji} {picked.name}</span>
              <span className="ml-2 text-slate-400">{picked.hint}</span>
            </>
          ) : (
            <span className="text-slate-400">
              Tap a slot to inspect it. Loot unlocks when you finish challenge lists and career
              milestones.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampInventory;
