import { Ruler } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useUnits, useUnitsPreference, setStoredUnits } from "@/hooks/useUnits";

/** Metres / feet toggle for altitudes, with an "auto" fallback. */
const UnitsPicker = () => {
  const units = useUnits();
  const pref = useUnitsPreference();

  const options: { key: "auto" | "metric" | "imperial"; label: string }[] = [
    { key: "metric", label: "Metres" },
    { key: "imperial", label: "Feet" },
    { key: "auto", label: "Auto" },
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Ruler className="w-4 h-4 text-primary" />
        <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-display">Altitude units</p>
      </div>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        Currently showing heights in {units === "imperial" ? "feet" : "metres"}
        {pref ? "" : " (detected automatically)"}.
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = o.key === "auto" ? pref === null : pref === o.key;
          return (
            <Button
              key={o.key}
              size="sm"
              variant={active ? "default" : "secondary"}
              onClick={() => setStoredUnits(o.key === "auto" ? null : o.key)}
            >
              {o.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default UnitsPicker;
