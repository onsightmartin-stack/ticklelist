import { Bookmark, Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type WallSort = "newest" | "oldest" | "top";

interface Props {
  sort: WallSort;
  onSort: (s: WallSort) => void;
  query: string;
  onQuery: (q: string) => void;
  peak: string;
  onPeak: (p: string) => void;
  peaks: string[];
  total: number;
  shown: number;
  savedOnly?: boolean;
  onSavedOnly?: (v: boolean) => void;
  savedCount?: number;
}

const sorts: { key: WallSort; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "top", label: "Top" },
  { key: "oldest", label: "Oldest" },
];

/** Sort + filter bar for the Wall. */
const WallControls = ({
  sort,
  onSort,
  query,
  onQuery,
  peak,
  onPeak,
  peaks,
  total,
  shown,
  savedOnly = false,
  onSavedOnly,
  savedCount = 0,
}: Props) => (
  <div className="rounded-lg border border-border bg-card/60 p-3 space-y-3">
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground">
        <Filter className="w-3.5 h-3.5" /> Sort
      </span>
      {sorts.map((s) => (
        <Button
          key={s.key}
          type="button"
          size="sm"
          variant={sort === s.key ? "default" : "outline"}
          onClick={() => onSort(s.key)}
        >
          {s.label}
        </Button>
      ))}

      {onSavedOnly && (
        <Button
          type="button"
          size="sm"
          variant={savedOnly ? "default" : "outline"}
          onClick={() => onSavedOnly(!savedOnly)}
          aria-pressed={savedOnly}
        >
          <Bookmark className={cn("w-3.5 h-3.5 mr-1", savedOnly && "fill-current")} /> Saved
          {savedCount > 0 && <span className="ml-1 text-[11px] opacity-80">{savedCount}</span>}
        </Button>
      )}

      <div className="relative ml-auto w-full sm:w-56">
        <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search posts, #tags, people"
          aria-label="Search posts"
          className="pl-7"
        />
      </div>
    </div>

    {peaks.length > 0 && (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs uppercase tracking-widest text-muted-foreground mr-1">Peak / country</span>
        {peaks.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPeak(peak === p ? "" : p)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs transition-colors",
              peak === p
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {p}
          </button>
        ))}
        {peak && (
          <button
            type="button"
            onClick={() => onPeak("")}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>
    )}

    <p className="text-[11px] text-muted-foreground">
      Showing {shown} of {total} post{total === 1 ? "" : "s"}
      {savedOnly ? " · saved only" : ""}
    </p>
  </div>
);

export default WallControls;
