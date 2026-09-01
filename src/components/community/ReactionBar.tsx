import { useState } from "react";
import { SmilePlus } from "lucide-react";

import { REACTIONS, reactionEmoji, reactionLabel, type ReactionKey } from "@/lib/reactions";
import { cn } from "@/lib/utils";

interface Props {
  /** Count per reaction key. */
  counts: Record<string, number>;
  /** The current member's reaction, if any. */
  mine: ReactionKey | null;
  onReact: (key: ReactionKey | null) => void;
  disabled?: boolean;
}

/**
 * Facebook-style reaction control: one tap toggles a 👍, long-press-free
 * picker opens the full emoji set, and existing reactions show as tallies.
 */
const ReactionBar = ({ counts, mine, onReact, disabled = false }: Props) => {
  const [open, setOpen] = useState(false);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const present = REACTIONS.filter((r) => (counts[r.key] ?? 0) > 0);

  const pick = (key: ReactionKey) => {
    setOpen(false);
    onReact(mine === key ? null : key);
  };

  return (
    <div className="relative flex items-center gap-1.5">
      <button
        type="button"
        disabled={disabled}
        onClick={() => (mine ? onReact(null) : onReact("like"))}
        onContextMenu={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
        aria-label={mine ? `Remove ${reactionLabel(mine)}` : "React with a like"}
        className={cn(
          "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] transition-colors",
          mine ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground",
        )}
      >
        <span aria-hidden="true">{mine ? reactionEmoji(mine) : "👍"}</span>
        {mine ? reactionLabel(mine) : "React"}
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-label="Choose a reaction"
        aria-expanded={open}
        className="grid h-7 w-7 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground"
      >
        <SmilePlus className="h-3.5 w-3.5" />
      </button>

      {present.length > 0 && (
        <span className="ml-1 inline-flex items-center gap-0.5 text-[11px] text-muted-foreground">
          {present.map((r) => (
            <span key={r.key} title={`${r.label} · ${counts[r.key]}`} aria-hidden="true">
              {r.emoji}
            </span>
          ))}
          <span className="ml-1">{total}</span>
        </span>
      )}

      {open && (
        <div
          className="absolute bottom-9 left-0 z-40 flex gap-1 rounded-full border border-border bg-popover px-2 py-1.5 shadow-lg"
          role="menu"
        >
          {REACTIONS.map((r) => (
            <button
              key={r.key}
              type="button"
              role="menuitem"
              onClick={() => pick(r.key)}
              title={r.label}
              aria-label={r.label}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-full text-lg transition-transform hover:scale-125",
                mine === r.key && "bg-primary/15",
              )}
            >
              <span aria-hidden="true">{r.emoji}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReactionBar;
