import { useEffect, useMemo, useRef, useState } from "react";
import { Mountain, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { highlightMatch } from "@/lib/highlight";
import { peakLabel } from "@/lib/peak-link";
import { searchPeaks, type CatalogPeak } from "@/lib/peak-catalog";
import { searchPlaces } from "@/data/places";
import { useWorldPeaks } from "@/hooks/useWorldPeaks";
import { useRemotePeakSearch } from "@/hooks/useRemotePeakSearch";
import { useRemotePlaceSearch } from "@/hooks/useRemotePlaceSearch";
import { cn } from "@/lib/utils";
import { formatElevation } from "@/lib/units";
import { useUnits } from "@/hooks/useUnits";
import AddPeakDialog from "@/components/community/AddPeakDialog";


interface Props {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  /** Store just the peak name instead of "Peak · Country". */
  nameOnly?: boolean;
  /** Fired with the full catalog entry when a suggestion is picked. */
  onPick?: (peak: CatalogPeak) => void;
  id?: string;
}

/**
 * Optional "related peak / country" picker for the composer. Free text still
 * works, but picking a catalog peak stores "Peak · Country" so the post can
 * deep-link to the matching highpoint page.
 *
 * Search reach matches the site-wide search: local catalog + the global peak
 * database + the worldwide sightseeing places table.
 */
const PeakSelector = ({
  value,
  onChange,
  className,
  placeholder = "Related peak or country (optional)",
  nameOnly = false,
  onPick,
  id,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const worldPeaks = useWorldPeaks();
  const units = useUnits();
  const remotePeaks = useRemotePeakSearch(value, 6);
  const remotePlaces = useRemotePlaceSearch(value, 4);

  const results = useMemo<CatalogPeak[]>(() => {
    const q = value.trim();
    if (q.length < 2) return [];
    const merged: CatalogPeak[] = [];
    const seen = new Set<string>();
    const push = (p: CatalogPeak) => {
      const k = `${p.name.toLowerCase()}|${(p.country ?? "").toLowerCase()}`;
      if (seen.has(k)) return;
      seen.add(k);
      merged.push(p);
    };
    searchPeaks(q, 6).forEach(push);
    remotePeaks.forEach(push);
    searchPlaces(q, 3).forEach((pl) =>
      push({
        key: pl.key,
        name: pl.name,
        elevation: "—",
        country: pl.country ?? "",
        type: "famous_peak",
        group: pl.group,
      }),
    );
    remotePlaces.forEach((pl) =>
      push({
        key: pl.key,
        name: pl.name,
        elevation: "—",
        country: pl.country ?? "",
        type: "famous_peak",
        group: pl.group,
      }),
    );
    return merged.slice(0, 12);
  }, [value, worldPeaks, remotePeaks, remotePlaces]);

  useEffect(() => setActive(0), [value]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const pick = (peak: CatalogPeak) => {
    onChange(nameOnly ? peak.name : peakLabel(peak));
    onPick?.(peak);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
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
      <Mountain className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
      <Input
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        maxLength={120}
        placeholder={placeholder}
        aria-label="Related peak or country"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-autocomplete="list"
        className="pl-7 pr-7"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear peak"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {open && results.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-64 overflow-auto rounded-md border border-border bg-popover shadow-lg"
        >
          {results.map((p, i) => (
            <li key={p.key}>
              <button
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(p)}
                className={cn(
                  "flex w-full items-baseline gap-2 px-3 py-2 text-left text-sm",
                  i === active && "bg-accent",
                )}
              >
                <span className="font-display tracking-wider">{highlightMatch(p.name, value)}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {p.country} · {formatElevation(p.elevation, units) ?? p.elevation}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-1">
        <AddPeakDialog initialName={value} onCreated={pick} />
      </div>
    </div>
  );
};


export default PeakSelector;
