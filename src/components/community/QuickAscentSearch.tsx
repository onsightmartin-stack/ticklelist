import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Plus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@/lib/router-compat";
import { searchPeaks, type CatalogPeak } from "@/lib/peak-catalog";
import { rememberPeakKey } from "@/lib/recent-peaks";
import { useWorldPeaks } from "@/hooks/useWorldPeaks";
import { useRemotePeakSearch } from "@/hooks/useRemotePeakSearch";
import { highlightMatch } from "@/lib/highlight";
import { cn } from "@/lib/utils";
import { formatElevation } from "@/lib/units";
import { useUnits } from "@/hooks/useUnits";

/**
 * Top-bar quick search: type a peak, hit enter (or click) and land straight
 * in the ascent form with that peak pre-selected.
 */
const QuickAscentSearch = ({ className = "" }: { className?: string }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const worldPeaks = useWorldPeaks();
  const remote = useRemotePeakSearch(query, 8);
  const units = useUnits();

  /**
   * Suggestions refresh on every keystroke: the local catalog answers
   * instantly, the global peak database fills in behind it (debounced).
   */
  const results = useMemo<CatalogPeak[]>(() => {
    if (query.trim().length < 2) return [];
    const local = searchPeaks(query, 6);
    const seen = new Set(local.map((p) => p.name.toLowerCase()));
    return [...local, ...remote.filter((p) => !seen.has(p.name.toLowerCase()))].slice(0, 8);
  }, [query, worldPeaks, remote]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const pick = (peak: CatalogPeak) => {
    setQuery("");
    setOpen(false);
    rememberPeakKey(peak.key);
    navigate(`/community/ascents?new=1&peak=${encodeURIComponent(peak.key)}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const peak = results[active];
      if (peak) pick(peak);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Quick log — search a peak…"
          aria-label="Quick ascent search"
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls="quick-ascent-suggestions"
          aria-autocomplete="list"
          aria-activedescendant={results[active] ? `quick-ascent-opt-${results[active].key}` : undefined}
          autoComplete="off"
          className="h-8 pl-8 pr-8 text-xs"
        />
        <Plus className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
      </div>

      {open && query.trim().length >= 2 && (
        <div
          id="quick-ascent-suggestions"
          role="listbox"
          className="absolute left-0 right-0 mt-1 rounded-md border border-border bg-popover shadow-lg z-50 overflow-hidden"
        >
          {results.length === 0 ? (
            <p className="px-3 py-3 text-xs text-muted-foreground">No matching peak in the catalog.</p>
          ) : (
            results.map((p, i) => (
              <button
                key={p.key}
                id={`quick-ascent-opt-${p.key}`}
                role="option"
                aria-selected={i === active}
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(p)}
                className={cn(
                  "w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2",
                  i === active ? "bg-accent" : "hover:bg-accent",
                )}
              >
                <span className="truncate">
                  {highlightMatch(p.name, query)}
                  <span className="text-muted-foreground"> · {highlightMatch(p.country, query)}</span>
                </span>
                <span className="text-[10px] text-muted-foreground shrink-0">{formatElevation(p.elevation, units) ?? p.elevation}</span>
              </button>
            ))
          )}
          <div className="border-t border-border px-3 py-1.5 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-0 text-[11px] text-muted-foreground"
              onClick={() => { setOpen(false); setQuery(""); navigate("/community/ascents?new=1"); }}
            >
              Open the full log form
            </Button>
            {results.length > 0 && (
              <span className="text-[10px] text-muted-foreground shrink-0">
                Enter logs the top match
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickAscentSearch;
