import { Hammer, Lock, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { buildUnlocked, campBuilds, nextBuildFor, type CampBuildKind } from "@/lib/camp-builds";

interface Props {
  level: number;
  picked: string;
  onPick: (id: string) => void;
  name: string;
  onName: (v: string) => void;
  placeholder: string;
  saving: boolean;
  hasBuild: boolean;
  /** Quest ids the climber has finished — some builds unlock through quests. */
  completedQuests: string[];
  onBuild: (kind: CampBuildKind) => void;
  onRemove: () => void;
  onClose: () => void;
}

/** In-game build menu, shown as an overlay panel over the camp. */
const CampBuildMenu = ({
  level,
  picked,
  onPick,
  name,
  onName,
  placeholder,
  saving,
  hasBuild,
  completedQuests,
  onBuild,
  onRemove,
  onClose,
}: Props) => {
  const nextLocked = nextBuildFor(level);

  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-xl rounded-xl border-4 border-slate-600 bg-slate-800/95 p-3 shadow-2xl">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-display text-sm uppercase tracking-[0.2em] text-slate-100">
            <Hammer className="h-4 w-4 text-primary" /> Build menu
          </h2>
          <div className="flex items-center gap-1">
            {hasBuild && (
              <Button type="button" size="sm" variant="ghost" className="h-8 text-slate-200" onClick={onRemove}>
                <Trash2 className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">Pack down</span>
              </Button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close build menu"
              className="grid h-8 w-8 place-items-center rounded-md border border-slate-500 bg-slate-700 text-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Input
            value={name}
            onChange={(e) => onName(e.target.value)}
            maxLength={40}
            placeholder={placeholder}
            className="h-9 w-full flex-1 bg-slate-900 text-slate-100 sm:w-auto"
            aria-label="Name your build"
          />
          <Button
            type="button"
            className="h-9"
            disabled={saving || !picked}
            onClick={() => {
              const kind = campBuilds.find((b) => b.id === picked);
              if (kind) onBuild(kind);
            }}
          >
            <Hammer className="h-4 w-4" />
            <span className="ml-1">{hasBuild ? "Rebuild here" : "Build here"}</span>
          </Button>
        </div>

        <ul className="mt-2 grid max-h-[36vh] gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
          {campBuilds.map((b) => {
            const locked = !buildUnlocked(b, level, completedQuests);
            const lockLabel = b.requiresQuest
              ? `Locked — ${b.questHint ?? "finish the quest"}`
              : `Locked — level ${b.minLevel}`;
            const openLabel = b.requiresQuest ? "Quest reward" : `Level ${b.minLevel}`;
            const active = picked === b.id;
            return (
              <li key={b.id}>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => onPick(b.id)}
                  className={`flex w-full items-start gap-2 rounded-md border-2 p-2 text-left transition-colors ${
                    active
                      ? "border-primary bg-primary/20"
                      : locked
                        ? "border-slate-700 bg-slate-900/60 opacity-60"
                        : "border-slate-600 bg-slate-900/60 hover:bg-slate-700"
                  }`}
                >
                  <span className="mt-0.5">
                    {locked ? (
                      <Lock className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Hammer className="h-4 w-4 text-primary" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-xs tracking-wider text-slate-100">
                      {b.name}
                    </span>
                    <span className="block text-[11px] text-slate-400">{b.blurb}</span>
                    <span className="block text-[10px] uppercase tracking-[0.18em] text-slate-500">
                      {locked ? lockLabel : openLabel}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <p className="mt-2 text-[11px] text-slate-400">
          Walk to a spot first — your build goes up where your climber stands.
          {nextLocked && ` Next unlock: ${nextLocked.name} at level ${nextLocked.minLevel}.`}
        </p>
      </div>
    </div>
  );
};

export default CampBuildMenu;
