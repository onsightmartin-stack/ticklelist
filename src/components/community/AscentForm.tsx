import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Clock, ImagePlus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { findPeak, searchPeaks, type CatalogPeak, type Ascent, type DatePrecision } from "@/lib/peak-catalog";
import { searchPlaces } from "@/data/places";
import { getRecentPeakKeys, rememberPeakKey } from "@/lib/recent-peaks";
import { useWorldPeaks } from "@/hooks/useWorldPeaks";
import { useRemotePeakSearch } from "@/hooks/useRemotePeakSearch";
import { highlightMatch } from "@/lib/highlight";
import { findDuplicateAscent, type DupeCandidate } from "@/lib/ascent-dupes";
import ClimbPartners from "@/components/community/ClimbPartners";
import { celebrate } from "@/components/Celebration";
import PrecisionDateInput from "@/components/community/PrecisionDateInput";
import AddPeakDialog from "@/components/community/AddPeakDialog";

import { parseElevationM } from "@/lib/peak-catalog";


interface AscentFormProps {
  userId: string;
  onCreated: () => void;
  onCancel: () => void;
  /** Pre-selected peak key, e.g. from the top-bar quick search. */
  initialPeakKey?: string | undefined;
  /** Member pre-linked as co-climber (e.g. from an invite link). */
  initialPartnerId?: string | undefined;
  /** When set, the form edits this existing ascent instead of creating a new one. */
  editing?: Ascent | undefined;
}

/** Best-effort mapping from a stored ascent back to a catalog peak key. */
const keyForAscent = (a: Ascent) =>
  a.peak_type === "country_highpoint" ? `hp:${a.country ?? ""}` : `fp:${a.peak_name}`;

const AscentForm = ({ userId, onCreated, onCancel, initialPeakKey, initialPartnerId, editing }: AscentFormProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [peakKey, setPeakKey] = useState<string>(
    editing ? (findPeak(keyForAscent(editing)) ? keyForAscent(editing) : "") : initialPeakKey ?? "",
  );
  const [date, setDate] = useState(editing?.ascent_date ?? new Date().toISOString().slice(0, 10));
  const [precision, setPrecision] = useState<DatePrecision>(editing?.date_precision ?? "day");

  const [route, setRoute] = useState(editing?.route ?? "");
  const [report, setReport] = useState(editing?.trip_report ?? "");
  const [photoUrl, setPhotoUrl] = useState(editing?.photo_url ?? "");
  const [isPublic, setIsPublic] = useState(editing?.is_public ?? true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dupeConfirmed, setDupeConfirmed] = useState(false);
  const [partnerIds, setPartnerIds] = useState<string[]>(
    editing?.partner_ids ?? (initialPartnerId && initialPartnerId !== userId ? [initialPartnerId] : []),
  );
  const [partnerNames, setPartnerNames] = useState<string[]>(editing?.partner_names ?? []);
  const [withGroup, setWithGroup] = useState(editing?.with_group ?? false);
  const [guiding, setGuiding] = useState<"" | "self_guided" | "guided">(editing?.guiding ?? "");
  const [oxygen, setOxygen] = useState<"" | "no_oxygen" | "oxygen">(editing?.oxygen ?? "");
  // Quick add is the default; details expand on demand (or when an edit has them).
  const [advanced, setAdvanced] = useState(
    Boolean(
      editing &&
        (editing.route ||
          editing.trip_report ||
          editing.photo_url ||
          editing.guiding ||
          editing.oxygen ||
          editing.with_group ||
          (editing.partner_ids?.length ?? 0) > 0 ||
          (editing.partner_names?.length ?? 0) > 0),
    ) || Boolean(initialPartnerId),
  );


  const fileInputRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef<HTMLButtonElement>(null);


  const uploadPhoto = async (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: "Photo is too large (max 8 MB)", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("ascent-photos")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      setUploading(false);
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      return;
    }
    // The bucket is private, so store a long-lived signed link (10 years).
    const { data, error: signError } = await supabase.storage
      .from("ascent-photos")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    setUploading(false);
    if (signError || !data?.signedUrl) {
      toast({ title: "Could not link the photo", description: signError?.message, variant: "destructive" });
      return;
    }
    setPhotoUrl(data.signedUrl);
    toast({ title: "Photo uploaded 📷" });
  };


  const worldPeaks = useWorldPeaks();
  // Same reach as the start-page search: local catalog + the global peak
  // database + countries/places (resolved to their high point).
  const remotePeaks = useRemotePeakSearch(query, 8);
  const results = useMemo(() => {
    const q = query.trim();
    const local = searchPeaks(q);
    const seen = new Set(local.map((p) => `${p.name.toLowerCase()}|${(p.country ?? "").toLowerCase()}`));
    const merged = [...local];
    for (const p of remotePeaks) {
      const k = `${p.name.toLowerCase()}|${(p.country ?? "").toLowerCase()}`;
      if (seen.has(k)) continue;
      seen.add(k);
      merged.push(p);
    }
    if (q.length >= 2) {
      for (const place of searchPlaces(q, 4)) {
        const hp = place.country ? findPeak(`hp:${place.country}`) : undefined;
        if (!hp) continue;
        const k = `${hp.name.toLowerCase()}|${(hp.country ?? "").toLowerCase()}`;
        if (seen.has(k)) continue;
        seen.add(k);
        merged.push({ ...hp, group: "Countries & places" });
      }
    }
    return merged;
  }, [query, worldPeaks, remotePeaks]);

  const [picked, setPicked] = useState<CatalogPeak | undefined>(undefined);
  // When editing an ascent whose peak isn't in the local catalog, fall back to
  // the stored ascent details so co-climber/style edits still save.
  const editedPeak: CatalogPeak | undefined = editing
    ? {
        key: keyForAscent(editing),
        name: editing.peak_name,
        type: editing.peak_type,
        country: editing.country ?? undefined,
        elevation: editing.elevation ?? undefined,
        group: "Your ascent",
      } as CatalogPeak
    : undefined;
  const selected: CatalogPeak | undefined = picked ?? findPeak(peakKey) ?? editedPeak;

  const elevationM = parseElevationM(selected?.elevation);
  // Style questions only matter on the big hills — but always show them when
  // the ascent already carries a value, so an edit never silently drops it.
  const showGuiding = (elevationM ?? 0) >= 3000 || Boolean(editing?.guiding);
  const showOxygen = (elevationM ?? 0) >= 7000 || Boolean(editing?.oxygen);


  const [recentKeys, setRecentKeys] = useState<string[]>([]);
  useEffect(() => setRecentKeys(getRecentPeakKeys()), []);
  const recentPeaks = useMemo(
    () => recentKeys.map((k) => findPeak(k)).filter((p): p is CatalogPeak => Boolean(p)),
    [recentKeys],
  );

  const choosePeak = (p: CatalogPeak) => {
    setPicked(p);
    setPeakKey(p.key);
    setRecentKeys(rememberPeakKey(p.key));
    setOpen(false);
  };

  const grouped = useMemo(() => {
    const map = new Map<string, CatalogPeak[]>();
    results.forEach((p) => {
      if (!map.has(p.group)) map.set(p.group, []);
      map.get(p.group)!.push(p);
    });
    return [...map.entries()];
  }, [results]);

  const showRecents = query.trim() === "" && recentPeaks.length > 0;
  const navList = showRecents ? recentPeaks : results;

  useEffect(() => setActive(0), [query]);
  // Any change to peak or date makes a previous "save anyway" confirmation stale.
  useEffect(() => setDupeConfirmed(false), [peakKey, date, precision]);


  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [active]);



  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) {
      toast({ title: "Pick a peak from the list", variant: "destructive" });
      return;
    }
    if (!date) {
      toast({ title: "Add the date of your ascent", variant: "destructive" });
      return;
    }
    // Month/year only entries are stored on the 1st of the period.
    const storedDate =
      precision === "year"
        ? `${date.slice(0, 4)}-01-01`
        : precision === "month"
          ? `${date.slice(0, 7)}-01`
          : date;
    if (new Date(storedDate) > new Date()) {
      toast({ title: "Ascent date can't be in the future", variant: "destructive" });
      return;
    }
    // Block accidental duplicates: same peak, or same country high point,
    // on an overlapping date range. A second submit confirms a genuine repeat.
    if (!dupeConfirmed) {
      const { data: existing } = await supabase
        .from("ascents")
        .select("id, peak_name, peak_type, country, ascent_date, date_precision")
        .eq("user_id", userId);
      const clash = findDuplicateAscent((existing ?? []) as DupeCandidate[], {
        id: editing?.id,
        peak_name: selected.name,
        peak_type: selected.type,
        country: selected.country ?? null,
        date: storedDate,
        precision,
      });
      if (clash) {
        setDupeConfirmed(true);
        toast({
          title: clash.reason === "highpoint" ? "Already logged this high point" : "Already logged this peak",
          description: `${clash.match.peak_name} overlaps an ascent you logged on ${clash.match.ascent_date}. Submit again to save it anyway.`,
          variant: "destructive",
        });
        return;
      }
    }
    setBusy(true);

    const payload = {
      peak_name: selected.name,
      peak_type: selected.type,
      country: selected.country,
      elevation: selected.elevation,
      ascent_date: storedDate,
      date_precision: precision,

      route: route.trim().slice(0, 120) || null,
      trip_report: report.trim().slice(0, 4000) || null,
      photo_url: photoUrl.trim().slice(0, 2000) || null,
      is_public: isPublic,
      partner_ids: partnerIds,
      partner_names: partnerNames,
      with_group: withGroup,
      guiding: showGuiding && guiding ? guiding : null,
      oxygen: showOxygen && oxygen ? oxygen : null,
    };
    const { error } = editing
      ? await supabase.from("ascents").update(payload).eq("id", editing.id)
      : await supabase.from("ascents").insert({ user_id: userId, ...payload });
    setBusy(false);
    if (error) {
      toast({
        title: editing ? "Could not update ascent" : "Could not log ascent",
        description: error.message.includes("ascents_unique_per_day")
          ? "You already logged that peak on that date."
          : error.message,
        variant: "destructive",
      });
      return;
    }
    rememberPeakKey(selected.key);
    if (!editing) celebrate();
    toast({ title: editing ? "Ascent updated ✏️" : "Ascent logged 🏔️" });
    onCreated();
  };

  return (
    <form onSubmit={submit} className="rounded-lg border border-border bg-card p-5 space-y-4">
      <h2 className="font-display tracking-wider text-lg">{editing ? "Edit ascent" : "Log an ascent"}</h2>
      <p className="text-xs text-muted-foreground -mt-2">
        Search any peak, country or place — country high points, famous peaks and the global summit database.
      </p>


      <div className="space-y-2">
        <Label>Peak</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              className="w-full justify-between font-normal"
            >
              {selected ? `${selected.name} · ${selected.country}` : "Search peaks, countries and places…"}
              <ChevronsUpDown className="w-4 h-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 pointer-events-auto" align="start">
            <div className="p-2 border-b border-border">
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setOpen(false);
                    return;
                  }
                  if (!navList.length) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActive((i) => (i + 1) % navList.length);
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActive((i) => (i - 1 + navList.length) % navList.length);
                  } else if (e.key === "Home") {
                    e.preventDefault();
                    setActive(0);
                  } else if (e.key === "End") {
                    e.preventDefault();
                    setActive(navList.length - 1);
                  } else if (e.key === "Enter" || e.key === "Tab") {
                    e.preventDefault();
                    const p = navList[Math.min(active, navList.length - 1)];
                    if (p) choosePeak(p);
                  }
                }}
                placeholder="Start typing… e.g. &quot;zug&quot; → Zugspitze"
                className="h-9"
              />
            </div>
            {showRecents && (
              <div className="border-b border-border py-1">
                <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Recently searched
                </p>
                {recentPeaks.map((p, i) => {
                  const isActive = i === active;
                  return (
                    <button
                      key={`recent-${p.key}`}
                      type="button"
                      ref={isActive ? activeRef : undefined}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => choosePeak(p)}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 hover:bg-accent",
                        isActive && "bg-accent",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                        {p.name}
                        <span className="text-muted-foreground">· {p.country}</span>
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">{p.elevation}</span>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="max-h-60 sm:max-h-72 overflow-y-auto py-1">
              {grouped.length === 0 && (
                <p className="px-3 py-4 text-sm text-muted-foreground">No match yet — keep typing a peak, country or place.</p>
              )}
              {grouped.map(([group, peaks]) => (
                <div key={group}>
                  <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {group}
                  </p>
                  {peaks.map((p) => {
                    const isActive = !showRecents && p.key === results[active]?.key;
                    return (
                      <button
                        key={p.key}
                        ref={isActive ? activeRef : undefined}
                        type="button"
                        onMouseEnter={() => {
                          const idx = results.findIndex((r) => r.key === p.key);
                          if (idx !== -1) setActive(idx);
                        }}
                        onClick={() => choosePeak(p)}
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2",
                          isActive ? "bg-accent" : "hover:bg-accent",
                          p.key === peakKey && "bg-accent/60",
                        )}
                      >
                        <span>
                          {highlightMatch(p.name, query)}
                          <span className="text-muted-foreground"> · {highlightMatch(p.country, query)}</span>
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {p.elevation}
                          {p.key === peakKey && <Check className="inline w-3 h-3 ml-1" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <AddPeakDialog
          initialName={query}
          onCreated={(p) => {
            setOpen(false);
            choosePeak(p);
          }}
        />

      </div>

      <div className="grid gap-4">

        <div className="space-y-2">
          <PrecisionDateInput
            id="ascent-date"
            label="Date of ascent"
            value={date}
            precision={precision}
            onChange={(v, p) => { setDate(v); setPrecision(p); }}
          />
        </div>
      </div>

      {!advanced && (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-center font-normal"
          onClick={() => setAdvanced(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add more info
        </Button>
      )}

      {advanced && (
        <div className="space-y-4 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">More details</p>
            <button
              type="button"
              onClick={() => setAdvanced(false)}
              className="text-xs underline text-muted-foreground hover:text-foreground"
            >
              Hide
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ascent-route">Route (optional)</Label>
            <Input id="ascent-route" value={route} onChange={(e) => setRoute(e.target.value)} placeholder="Hörnli ridge, Normal route…" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ascent-report">Trip report (optional)</Label>
            <Textarea
              id="ascent-report"
              value={report}
              onChange={(e) => setReport(e.target.value)}
              rows={5}
              placeholder="Conditions, timings, gear, how it went…"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ascent-photo">Summit photo (optional)</Label>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <Input
                id="ascent-photo"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="Paste a link, or upload a photo →"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadPhoto(file);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="shrink-0"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="w-4 h-4 mr-1" />
                {uploading ? "Uploading…" : "Upload photo"}
              </Button>
            </div>
            {photoUrl && (
              <div className="flex items-center gap-3">
                <img
                  src={photoUrl}
                  alt="Preview of the summit photo attached to this ascent"
                  className="h-20 w-20 rounded-md object-cover border border-border"
                  loading="lazy"
                />
                <button
                  type="button"
                  onClick={() => setPhotoUrl("")}
                  className="text-xs underline text-muted-foreground hover:text-foreground"
                >
                  Remove photo
                </button>
              </div>
            )}
          </div>

          <ClimbPartners
            userId={userId}
            partnerIds={partnerIds}
            partnerNames={partnerNames}
            withGroup={withGroup}
            onChange={(next) => {
              setPartnerIds(next.partnerIds);
              setPartnerNames(next.partnerNames);
              setWithGroup(next.withGroup);
            }}
            peakKey={selected?.key}
            peakName={selected?.name}
          />

          {(showGuiding || showOxygen) && (
            <div className="grid sm:grid-cols-2 gap-4">
              {showGuiding && (
                <div className="space-y-2">
                  <Label htmlFor="ascent-guiding">Style (3000 m+)</Label>
                  <select
                    id="ascent-guiding"
                    value={guiding}
                    onChange={(e) => setGuiding(e.target.value as typeof guiding)}
                    className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
                  >
                    <option value="">Not specified</option>
                    <option value="self_guided">Self-guided</option>
                    <option value="guided">With a guide</option>
                  </select>
                </div>
              )}
              {showOxygen && (
                <div className="space-y-2">
                  <Label htmlFor="ascent-oxygen">Oxygen (7000 m+)</Label>
                  <select
                    id="ascent-oxygen"
                    value={oxygen}
                    onChange={(e) => setOxygen(e.target.value as typeof oxygen)}
                    className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
                  >
                    <option value="">Not specified</option>
                    <option value="no_oxygen">No supplemental oxygen</option>
                    <option value="oxygen">With supplemental oxygen</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Switch id="ascent-public" checked={isPublic} onCheckedChange={setIsPublic} />
            <Label htmlFor="ascent-public" className="font-normal text-sm text-muted-foreground">
              Show this ascent publicly and count it on the leaderboard
            </Label>
          </div>
        </div>
      )}


      <div className="flex gap-3 pt-1">
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Log ascent"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
};

export default AscentForm;
