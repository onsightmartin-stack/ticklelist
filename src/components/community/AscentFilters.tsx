import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SortSelect from "@/components/community/SortSelect";
import { ascentSortOptions } from "@/lib/sorting";

export interface AscentFilterState {
  query: string;
  member: string;
  type: string;
  year: string;
  sort: string;
}

export const emptyAscentFilters: AscentFilterState = {
  query: "",
  member: "all",
  type: "all",
  year: "all",
  sort: "date_desc",
};

interface Props {
  value: AscentFilterState;
  onChange: (next: AscentFilterState) => void;
  members: { id: string; name: string }[];
  years: string[];
  resultCount: number;
  totalCount: number;
}

/** Filter bar for the ascent log: text search, member, peak type and year. */
const AscentFilters = ({ value, onChange, members, years, resultCount, totalCount }: Props) => {
  const set = (patch: Partial<AscentFilterState>) => onChange({ ...value, ...patch });
  const dirty =
    value.query !== "" ||
    value.member !== "all" ||
    value.type !== "all" ||
    value.year !== "all" ||
    value.sort !== "date_desc";

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder="Search peak, country or route…"
            aria-label="Search ascents"
            className="pl-9"
          />
        </div>

        <Select value={value.member} onValueChange={(v) => set({ member: v })}>
          <SelectTrigger className="w-[160px]" aria-label="Filter by member">
            <SelectValue placeholder="Member" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All members</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={value.type} onValueChange={(v) => set({ type: v })}>
          <SelectTrigger className="w-[170px]" aria-label="Filter by peak type">
            <SelectValue placeholder="Peak type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All peaks</SelectItem>
            <SelectItem value="country_highpoint">Country high points</SelectItem>
            <SelectItem value="famous_peak">Famous peaks</SelectItem>
          </SelectContent>
        </Select>

        <Select value={value.year} onValueChange={(v) => set({ year: v })}>
          <SelectTrigger className="w-[120px]" aria-label="Filter by year">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All years</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <SortSelect
          value={value.sort}
          onChange={(v) => set({ sort: v })}
          options={ascentSortOptions}
          label="Sort ascents"
          className="[&_button]:h-10 [&_button]:w-[170px] [&_button]:text-sm"
        />
      </div>

      <div className="flex items-center gap-3">
        <p className="text-xs text-muted-foreground">
          Showing {resultCount} of {totalCount} ascents
        </p>
        {dirty && (
          <Button variant="ghost" size="sm" onClick={() => onChange(emptyAscentFilters)}>
            <X className="w-3.5 h-3.5 mr-1" /> Clear
          </Button>
        )}
      </div>
    </div>
  );
};

export default AscentFilters;
