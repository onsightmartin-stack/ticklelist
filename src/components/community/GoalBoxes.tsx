import { useMemo, useState } from "react";
import { Check, ChevronDown, Minus, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { goalItems, type GoalProgress } from "@/lib/profile-goals";
import { Link } from "@/lib/router-compat";
import { frontRunnersHref } from "@/lib/frontrunners";
import type { Ascent } from "@/lib/peak-catalog";
import type { Visit } from "@/data/places";

interface Props {
  goals: GoalProgress[];
  ascents: Ascent[];
  visits: Visit[];
  /** Viewer's own logbooks, used for the side-by-side comparison. */
  myAscents?: Ascent[];
  myVisits?: Visit[];
  /** True when the profile being viewed is the viewer's own. */
  isMe?: boolean;
  memberName: string;
}

/** Progress boxes that expand to show exactly which entries are ticked. */
const GoalBoxes = ({ goals, ascents, visits, myAscents, myVisits, isMe, memberName }: Props) => {
  const [open, setOpen] = useState<string | null>(null);

  const items = useMemo(() => (open ? goalItems(open, ascents, visits) : null), [open, ascents, visits]);
  const mine = useMemo(
    () => (open && !isMe && myAscents && myVisits ? goalItems(open, myAscents, myVisits) : null),
    [open, isMe, myAscents, myVisits],
  );
  const myDone = useMemo(() => new Set((mine ?? []).filter((i) => i.done).map((i) => i.key)), [mine]);
  const openGoal = goals.find((g) => g.id === open);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {goals.map((g) => {
          const expandable = goalItems(g.id, ascents, visits) !== null;
          const active = open === g.id;
          return (
            <button
              key={g.id}
              type="button"
              disabled={!expandable}
              aria-expanded={active}
              onClick={() => setOpen(active ? null : g.id)}
              className={cn(
                "rounded-lg border bg-card p-3 text-left transition-colors",
                active ? "border-primary" : "border-border",
                expandable ? "hover:border-primary/60 cursor-pointer" : "cursor-default",
              )}
            >
              <p className="font-display text-2xl tracking-wider text-primary">
                {g.done}
                {g.total !== null && <span className="text-base text-muted-foreground">/{g.total}</span>}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="min-w-0 truncate">{g.label}</span>
                {expandable && (
                  <ChevronDown className={cn("w-3 h-3 shrink-0 transition-transform", active && "rotate-180")} />
                )}
              </p>
            </button>
          );
        })}
      </div>

      {open && items && (
        <div className="mt-3 rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
            <div className="flex items-center gap-3">
              <p className="font-display text-sm tracking-wider">{openGoal?.label}</p>
              <Link
                to={frontRunnersHref(open)}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Trophy className="w-3 h-3" /> Front runners
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              {isMe || !mine
                ? `${items.filter((i) => i.done).length} of ${items.length} ticked`
                : `${memberName}: ${items.filter((i) => i.done).length} · You: ${myDone.size} · Both: ${
                    items.filter((i) => i.done && myDone.has(i.key)).length
                  }`}
            </p>
          </div>
          <ul className="max-h-72 overflow-y-auto grid sm:grid-cols-2 gap-x-4 gap-y-1 pr-1">
            {items.map((i) => (
              <li key={i.key} className="flex items-center gap-2 text-sm">
                {i.done ? (
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                ) : (
                  <Minus className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                )}
                <span className={cn("truncate", i.done ? "text-foreground" : "text-muted-foreground")}>{i.label}</span>
                {mine && myDone.has(i.key) && (
                  <span className="ml-auto text-[10px] uppercase tracking-[0.15em] text-primary/80 shrink-0">You</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default GoalBoxes;
