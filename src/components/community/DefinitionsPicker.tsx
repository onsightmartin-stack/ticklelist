import { Check, Globe, Mountain, Ship } from "lucide-react";

import { cn } from "@/lib/utils";
import { useDefinitions } from "@/hooks/useDefinitions";
import CustomDefinitionBuilder from "@/components/community/CustomDefinitionBuilder";
import {
  countryDefinitions,
  countrySetFor,
  sevenSummitsDefinitions,
  territoryRules,
} from "@/lib/definitions";

interface OptionProps {
  active: boolean;
  name: string;
  blurb: string;
  count?: string;
  onClick: () => void;
}

const Option = ({ active, name, blurb, count, onClick }: OptionProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "w-full text-left rounded-lg border p-3 transition-colors",
      active ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/50",
    )}
    aria-pressed={active}
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-display tracking-wider text-sm">{name}</p>
        <p className="text-xs text-muted-foreground mt-1">{blurb}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {count && <span className="text-xs text-muted-foreground tabular-nums">{count}</span>}
        {active && <Check className="w-4 h-4 text-primary" aria-hidden="true" />}
      </div>
    </div>
  </button>
);

/** Lets a member choose which definition of the contested challenges they count by. */
const DefinitionsPicker = () => {
  const [defs, update] = useDefinitions();

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" aria-hidden="true" />
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-display">
            Country high points
          </p>
        </div>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Which countries count towards your high-point tally, badges and leaderboard rank.
        </p>
        <div className="grid gap-2">
          {countryDefinitions.map((d) => (
            <Option
              key={d.id}
              active={defs.countries === d.id}
              name={d.name}
              blurb={d.blurb}
              count={`${countrySetFor(d.id).size}`}
              onClick={() => update({ countries: d.id })}
            />
          ))}
        </div>
      </section>

      <CustomDefinitionBuilder />

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <Ship className="w-4 h-4 text-primary" aria-hidden="true" />
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-display">
            Mainland vs overseas
          </p>
        </div>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Eight countries have their true summit on a far-away island: the UK (Mount Paget, South
          Georgia), Spain, Portugal, Denmark, the Netherlands, Australia, Malaysia and Equatorial
          Guinea. Decide whether the mainland summit ticks the country for you.
        </p>
        <div className="grid gap-2">
          {territoryRules.map((d) => (
            <Option
              key={d.id}
              active={defs.territories === d.id}
              name={d.name}
              blurb={d.blurb}
              onClick={() => update({ territories: d.id })}
            />
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <Mountain className="w-4 h-4 text-primary" aria-hidden="true" />
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-display">Seven Summits</p>
        </div>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Kosciuszko or Carstensz? Pick the roster your Seven Summits goal is scored against.
        </p>
        <div className="grid gap-2">
          {sevenSummitsDefinitions.map((d) => (
            <Option
              key={d.id}
              active={defs.sevenSummits === d.id}
              name={d.name}
              blurb={d.blurb}
              count={d.id === "both" ? "8" : "7"}
              onClick={() => update({ sevenSummits: d.id })}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default DefinitionsPicker;
