import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ListDensity } from "@/hooks/useListDensity";

const OPTIONS: { value: ListDensity; label: string; full: string }[] = [
  { value: "small", label: "S", full: "Small list" },
  { value: "medium", label: "M", full: "Medium list" },
  { value: "large", label: "L", full: "Big list" },
];

interface DensityToggleProps {
  value: ListDensity;
  onChange: (next: ListDensity) => void;
  className?: string;
}

const DensityToggle = ({ value, onChange, className }: DensityToggleProps) => (
  <div className={cn("inline-flex items-center gap-1 rounded-md border border-border p-0.5", className)} role="group" aria-label="List size">
    {OPTIONS.map((o) => (
      <Button
        key={o.value}
        type="button"
        size="sm"
        variant={value === o.value ? "secondary" : "ghost"}
        aria-label={o.full}
        aria-pressed={value === o.value}
        onClick={() => onChange(o.value)}
        className="h-7 px-2 text-xs"
      >
        {o.label}
      </Button>
    ))}
  </div>
);

export default DensityToggle;
