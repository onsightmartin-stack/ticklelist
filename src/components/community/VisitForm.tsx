import { useEffect, useMemo, useState } from "react";
import { MapPin, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { celebrate } from "@/components/Celebration";
import PrecisionDateInput from "@/components/community/PrecisionDateInput";
import { findPlace, searchPlaces, type CatalogPlace, type Visit } from "@/data/places";
import { useRemotePlaceSearch } from "@/hooks/useRemotePlaceSearch";
import type { DatePrecision } from "@/lib/peak-catalog";

interface Props {
  userId: string;
  initialPlaceKey?: string;
  editing?: Visit | undefined;
  onSaved: () => void;
  onCancel?: () => void;
}

/** Log a place you've been — a country, a wonder, a pole or a landmark. */
const VisitForm = ({ userId, initialPlaceKey = "", editing, onSaved, onCancel }: Props) => {
  const [query, setQuery] = useState(editing?.place_name ?? "");
  const [place, setPlace] = useState<CatalogPlace | null>(
    editing
      ? findPlace(editing.place_key) ?? {
          key: editing.place_key,
          name: editing.place_name,
          country: editing.country,
          type: editing.place_type,
          group: "Saved place",
        } as CatalogPlace
      : null,
  );
  const [date, setDate] = useState(editing?.visit_date ?? "");
  const [precision, setPrecision] = useState<DatePrecision>(editing?.date_precision ?? "day");
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [saving, setSaving] = useState(false);
  // Quick add by default — notes appear on demand.
  const [advanced, setAdvanced] = useState(Boolean(editing?.notes));


  useEffect(() => {
    if (!initialPlaceKey) return;
    const found = findPlace(initialPlaceKey);
    if (found) {
      setPlace(found);
      setQuery(found.name);
    }
  }, [initialPlaceKey]);

  const remote = useRemotePlaceSearch(place ? "" : query, 8);

  const results = useMemo(() => {
    if (place || query.trim().length < 2) return [];
    const local = searchPlaces(query, 6);
    const seen = new Set(local.map((p) => p.name.toLowerCase()));
    return [...local, ...remote.filter((p) => !seen.has(p.name.toLowerCase()))].slice(0, 12);
  }, [query, place, remote]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!place) {
      toast({ title: "Pick a place from the list", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("visits").upsert(
      {
        user_id: userId,
        place_key: place.key,
        place_name: place.name,
        country: place.country,
        place_type: place.type,
        visit_date: date || null,
        date_precision: date ? precision : "day",
        notes: notes.trim() || null,
      },
      { onConflict: "user_id,place_key" },
    );
    setSaving(false);
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    if (!editing) celebrate();
    toast({ title: editing ? `${place.name} updated` : `${place.name} ticked off 🎉` });
    setPlace(null);
    setQuery("");
    setDate("");
    setPrecision("day");
    setNotes("");
    setAdvanced(false);

    onSaved();
  };

  return (
    <form onSubmit={submit} className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="relative">
        <Label htmlFor="visit-place">Place</Label>
        <Input
          id="visit-place"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPlace(null); }}
          placeholder="Country, wonder, pole or landmark…"
          autoComplete="off"
        />
        {results.length > 0 && (
          <div className="absolute left-0 right-0 mt-1 rounded-md border border-border bg-popover shadow-lg z-40 overflow-hidden">
            {results.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => { setPlace(p); setQuery(p.name); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2"
              >
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">{p.name}</span>
                <span className="ml-auto text-xs text-muted-foreground truncate">{p.group}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <PrecisionDateInput
        id="visit-date"
        label="Date (optional)"
        value={date}
        precision={precision}
        onChange={(v, p) => { setDate(v); setPrecision(p); }}
      />

      {!advanced ? (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-center font-normal"
          onClick={() => setAdvanced(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add more info
        </Button>
      ) : (
        <div className="space-y-2 border-t border-border pt-4">
          <Label htmlFor="visit-notes">Notes (optional)</Label>
          <Textarea
            id="visit-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What did you do there?"
            rows={3}
          />
        </div>
      )}


      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Tick it off"}</Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        )}
      </div>
    </form>
  );
};

export default VisitForm;
