import { ArrowDownWideNarrow } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SortOption {
  value: string;
  label: string;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  options: SortOption[];
  label?: string;
  className?: string;
}

/** Compact sort picker used across ascent / place / list views. */
const SortSelect = ({ value, onChange, options, label = "Sort", className }: Props) => (
  <div className={className}>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-[170px] text-xs" aria-label={label}>
        <ArrowDownWideNarrow className="w-3.5 h-3.5 mr-1 shrink-0 text-muted-foreground" />
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-xs">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export default SortSelect;
