import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import {
  DEFAULT_MOTION,
  getStoredMotion,
  MOTION_OPTIONS,
  setMotion,
  type MotionPref,
} from "@/lib/motion";

const MotionPicker = () => {
  const [active, setActive] = useState<MotionPref>(DEFAULT_MOTION);

  useEffect(() => {
    setActive(getStoredMotion());
  }, []);

  const choose = (id: MotionPref) => {
    setMotion(id);
    setActive(id);
  };

  return (
    <div role="radiogroup" aria-label="Motion sensitivity" className="grid gap-3 sm:grid-cols-3">
      {MOTION_OPTIONS.map((option) => {
        const selected = option.id === active;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => choose(option.id)}
            className={`text-left rounded-lg border p-4 transition-colors ${
              selected
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-display tracking-wider text-sm uppercase">{option.name}</span>
              {selected && <Check className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />}
            </div>
            <p className="text-xs text-muted-foreground mt-3">{option.description}</p>
          </button>
        );
      })}
    </div>
  );
};

export default MotionPicker;
