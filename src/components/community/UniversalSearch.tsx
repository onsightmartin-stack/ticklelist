import { fuzzyRank } from "@/lib/fuzzy";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Mountain, MapPin, User, Compass } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useNavigate } from "@/lib/router-compat";
import { searchPeaks, parseElevationM, type CatalogPeak } from "@/lib/peak-catalog";
import { searchPlaces, type CatalogPlace } from "@/data/places";
import { rememberPeakKey } from "@/lib/recent-peaks";
import { useCommunityData } from "@/hooks/useCommunityData";
import { useWorldPeaks } from "@/hooks/useWorldPeaks";
import { useRemotePeakSearch } from "@/hooks/useRemotePeakSearch";
import { useRemotePlaceSearch } from "@/hooks/useRemotePlaceSearch";
import { highlightMatch } from "@/lib/highlight";
import { cn } from "@/lib/utils";
import { formatElevation } from "@/lib/units";
import { useUnits } from "@/hooks/useUnits";

type Row =
  | { kind: "peak"; id: string; title: string; subtitle: string; peak: CatalogPeak }
  | { kind: "place"; id: string; title: string; subtitle: string; place: CatalogPlace }
  | { kind: "member"; id: string; title: string; subtitle: string; userId: string };

const ELEVATION_STEPS = [
  { label: "Any", value: 0 },
  { label: "1000m+", value: 1000 },
  { label: "2000m+", value: 2000 },
  { label: "4000m+", value: 4000 },
] as const;

const PROMINENCE_STEPS = [
  { label: "Any", value: 0 },
  { label: "300m+", value: 300 },
  { label: "1000m+", value: 1000 },
] as const;

const iconFor = {
  peak: Mountain,
  place: MapPin,
  member: User,
} as const;

const actionFor = {
  peak: "Log ascent",
  place: "Tick place",
  member: "View profile",
} as const;

interface Props {
  className?: string;
  /** Big hero styling for the main page. */
  size?: "sm" | "lg";
  autoFocus?: boolean;
}

/**
 * One search bar for the whole community: add an ascent, tick a place
 * you've been, or find an adventurer.
 */
const UniversalSearch = ({ className = "", size = "sm", autoFocus = false }: Props) => {
  const navigate = useNavigate();
  const { profiles } = useCommunityData();
  const worldPeaks = useWorldPeaks();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [minElevation, setMinElevation] = useState(0);
  const [minProminence, setMinProminence] = useState(0);
  const remotePeaks = useRemotePeakSearch(query, 6, { minElevation, minProminence });
  const remotePlaces = useRemotePlaceSearch(query, 6);
  const units = useUnits();

  const rows = useMemo<Row[]>(() => {
    const q = query.trim();
    if (q.length < 2) return [];

    const keepPeak = (p: CatalogPeak) => {
      const elev = p.elevationM ?? parseElevationM(p.elevation);
      if (minElevation > 0 && (elev == null || elev < minElevation)) return false;
      // Prominence is only known for catalog peaks, so a prominence filter
      // hides entries we can't verify.
      if (minProminence > 0 && (p.prominenceM == null || p.prominenceM < minProminence)) return false;
      return true;
    };

    const local = searchPeaks(q, 12).filter(keepPeak).slice(0, 5);
    const seen = new Set(local.map((p) => p.name.toLowerCase()));
    const merged = [
      ...local,
      ...remotePeaks.filter((p) => !seen.has(p.name.toLowerCase()) && keepPeak(p)).slice(0, 5),
    ];
    const peaks: Row[] = merged.map((p) => ({
      kind: "peak",
      id: p.key,
      title: p.name,
      subtitle: `${p.country} · ${formatElevation(p.elevation, units) ?? p.elevation}`,
      peak: p,
    }));

    const localPlaces = searchPlaces(q, 4);
    const placeSeen = new Set(localPlaces.map((p) => p.name.toLowerCase()));
    const places: Row[] = [
      ...localPlaces,
      ...remotePlaces.filter((p) => !placeSeen.has(p.name.toLowerCase())).slice(0, 4),
    ].map((p) => ({
      kind: "place",
      id: p.key,
      title: p.name,
      subtitle: p.group,
      place: p,
    }));

    const members: Row[] = fuzzyRank(Object.values(profiles), q, (p) => [p.display_name, p.country])
      .slice(0, 4)
      .map((p) => ({
        kind: "member" as const,
        id: p.id,
        title: p.display_name,
        subtitle: p.country ? `Adventurer · ${p.country}` : "Adventurer",
        userId: p.id,
      }));

    return [...peaks, ...places, ...members];
  }, [query, profiles, worldPeaks, remotePeaks, minElevation, minProminence, units]);

  useEffect(() => setActive(0), [query, minElevation, minProminence]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const pick = (row: Row) => {
    setQuery("");
    setOpen(false);
    if (row.kind === "peak") {
      rememberPeakKey(row.peak.key);
      navigate(`/community/ascents?new=1&peak=${encodeURIComponent(row.peak.key)}`);
    } else if (row.kind === "place") {
      navigate(`/community/my-adventures?tab=places&new=1&place=${encodeURIComponent(row.place.key)}`);
    } else {
      navigate(`/community/members/${row.userId}`);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!rows.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % rows.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + rows.length) % rows.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const row = rows[active];
      if (row) pick(row);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const big = size === "lg";

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <div className="relative">
        <Search
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none",
            big ? "w-5 h-5" : "w-3.5 h-3.5 left-2.5",
          )}
        />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          autoFocus={autoFocus}
          placeholder="Add ascent, a place or find an adventure…"
          aria-label="Search ascents, places and adventurers"
          role="combobox"
          aria-expanded={open && rows.length > 0}
          aria-controls="universal-search-suggestions"
          aria-autocomplete="list"
          aria-activedescendant={rows[active] ? `universal-opt-${rows[active].kind}-${rows[active].id}` : undefined}
          autoComplete="off"
          className={cn(big ? "h-14 pl-11 pr-4 text-base rounded-full shadow-lg" : "h-8 pl-8 pr-3 text-xs")}
        />
      </div>

      {open && query.trim().length >= 2 && (
        <div
          id="universal-search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 mt-2 rounded-xl border border-border bg-popover shadow-xl z-50 overflow-hidden text-left"
        >
          <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-3 py-2">
            <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mr-1">Height</span>
            {ELEVATION_STEPS.map((s) => (
              <button
                key={`elev-${s.value}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setMinElevation(s.value)}
                className={cn(
                  "px-2 py-0.5 rounded-full text-[11px] border transition-colors",
                  minElevation === s.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {s.label}
              </button>
            ))}
            <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mx-1">Prom</span>
            {PROMINENCE_STEPS.map((s) => (
              <button
                key={`prom-${s.value}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setMinProminence(s.value)}
                className={cn(
                  "px-2 py-0.5 rounded-full text-[11px] border transition-colors",
                  minProminence === s.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
          {rows.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted-foreground">
              {minElevation > 0 || minProminence > 0
                ? "Nothing matches those height/prominence filters. Try lowering them."
                : "Nothing found. Try a peak, a country, a wonder or a member name."}
            </p>
          ) : (
            rows.map((row, i) => {
              const Icon = iconFor[row.kind];
              const catalogId =
                row.kind === "peak" && /^wp:\d+$/.test(row.peak.key)
                  ? row.peak.key.slice(3)
                  : null;
              return (
                <div
                  key={`${row.kind}-${row.id}`}
                  id={`universal-opt-${row.kind}-${row.id}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    "w-full flex items-center",
                    i === active ? "bg-accent" : "hover:bg-accent",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => pick(row)}
                    className="min-w-0 flex-1 text-left px-4 py-2.5 flex items-center gap-3"
                  >
                    <Icon className="w-4 h-4 text-primary shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm truncate">{highlightMatch(row.title, query)}</span>
                      <span className="block text-xs text-muted-foreground truncate">{row.subtitle}</span>
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground shrink-0">
                      {actionFor[row.kind]}
                    </span>
                  </button>
                  {catalogId && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setOpen(false);
                        navigate(`/peaks/${catalogId}`);
                      }}
                      className="px-3 py-2.5 text-[10px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground shrink-0"
                    >
                      Details
                    </button>
                  )}
                </div>
              );
            })

          )}
          <div className="border-t border-border px-4 py-2 flex items-center gap-2 text-[11px] text-muted-foreground">
            <Compass className="w-3.5 h-3.5" />
            Peaks log an ascent · places tick your travel map · members open their profile
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversalSearch;
