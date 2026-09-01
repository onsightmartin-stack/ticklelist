import { useState } from "react";
import { Download, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { lookupPeakbaggerPeak } from "@/lib/peakbagger-peak.functions";
import type { CatalogPeak } from "@/lib/peak-catalog";

interface Props {
  /** Pre-fills the name field with whatever the member already typed. */
  initialName?: string;
  /** Fired with the newly created catalog entry so the caller can select it. */
  onCreated?: (peak: CatalogPeak) => void;
  className?: string;
}

interface FormState {
  name: string;
  country: string;
  admin1: string;
  elevation: string;
  prominence: string;
  lat: string;
  lon: string;
  firstAscentDate: string;
  firstAscentBy: string;
  notes: string;
  peakbaggerId: string;
}

const EMPTY: FormState = {
  name: "",
  country: "",
  admin1: "",
  elevation: "",
  prominence: "",
  lat: "",
  lon: "",
  firstAscentDate: "",
  firstAscentBy: "",
  notes: "",
  peakbaggerId: "",
};

const numOrNull = (v: string): number | null => {
  const n = Number(v.replace(",", ".").trim());
  return v.trim() === "" || !Number.isFinite(n) ? null : n;
};

/**
 * "Can't find a peak?" escape hatch: members add the missing summit or place
 * straight into the shared world catalog, optionally pulling the facts from
 * Peakbagger first.
 */
const AddPeakDialog = ({ initialName = "", onCreated, className }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ ...EMPTY, name: initialName });
  const [pulling, setPulling] = useState(false);
  const [saving, setSaving] = useState(false);
  const lookup = useServerFn(lookupPeakbaggerPeak);

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const pullFromPeakbagger = async () => {
    const query = form.peakbaggerId.trim() || form.name.trim();
    if (query.length < 2) {
      toast.error("Type a peak name or paste a Peakbagger link first.");
      return;
    }
    setPulling(true);
    try {
      const info = await lookup({ data: { query } });
      if (info.blocked) {
        toast.error("Peakbagger blocked the request — fill the details in by hand.");
        return;
      }
      if (!info.found) {
        toast.error(info.error ?? "Nothing found on Peakbagger.");
        return;
      }
      setForm((f) => ({
        ...f,
        name: f.name.trim() || info.name || "",
        country: f.country.trim() || (info.countryCode ?? ""),
        admin1: f.admin1.trim() || (info.admin1 ?? ""),
        elevation: f.elevation.trim() || (info.elevation != null ? String(info.elevation) : ""),
        prominence: f.prominence.trim() || (info.prominence != null ? String(info.prominence) : ""),
        lat: f.lat.trim() || (info.lat != null ? String(info.lat) : ""),
        lon: f.lon.trim() || (info.lon != null ? String(info.lon) : ""),
        firstAscentDate: f.firstAscentDate.trim() || (info.firstAscentDate ?? ""),
        firstAscentBy: f.firstAscentBy.trim() || (info.firstAscentBy ?? ""),
        peakbaggerId: info.pid ?? f.peakbaggerId,
      }));
      toast.success("Pulled what Peakbagger has — check it before saving.");
    } catch {
      toast.error("Could not reach Peakbagger right now.");
    } finally {
      setPulling(false);
    }
  };

  const save = async () => {
    if (!user) {
      toast.error("Sign in to add a peak.");
      return;
    }
    const name = form.name.trim();
    if (name.length < 2) {
      toast.error("Give the peak a name.");
      return;
    }
    const lat = numOrNull(form.lat);
    const lon = numOrNull(form.lon);
    if (lat !== null && (lat < -90 || lat > 90)) {
      toast.error("Latitude must be between -90 and 90.");
      return;
    }
    if (lon !== null && (lon < -180 || lon > 180)) {
      toast.error("Longitude must be between -180 and 180.");
      return;
    }
    const elevation = numOrNull(form.elevation);
    if (elevation !== null && (elevation < -500 || elevation > 8900)) {
      toast.error("That elevation (in metres) looks wrong.");
      return;
    }

    setSaving(true);
    const { data, error } = await supabase
      .from("world_peaks")
      .insert({
        name,
        country_code: form.country.trim() ? form.country.trim().slice(0, 2).toUpperCase() : null,
        admin1: form.admin1.trim().slice(0, 40) || null,
        elevation: elevation === null ? null : Math.round(elevation),
        prominence: (() => {
          const p = numOrNull(form.prominence);
          return p === null || p < 0 || p > 8900 ? null : Math.round(p);
        })(),
        lat,
        lon,
        feature_code: "PK",
        source: "member",
        added_by: user.id,
        first_ascent_date: form.firstAscentDate.trim().slice(0, 40) || null,
        first_ascent_by: form.firstAscentBy.trim().slice(0, 160) || null,
        notes: form.notes.trim().slice(0, 800) || null,
        peakbagger_id: form.peakbaggerId.trim().slice(0, 20) || null,
      })
      .select("id, name, elevation, country_code, prominence")
      .single();
    setSaving(false);

    if (error) {
      toast.error(
        error.code === "23505" ? "That peak is already in the database." : error.message,
      );
      return;
    }

    toast.success(`${data.name} added to the database.`);
    onCreated?.({
      key: `wp:${String(data.id)}`,
      name: data.name,
      elevation: data.elevation ? `${data.elevation} m` : "—",
      country: data.country_code ?? "",
      type: "famous_peak",
      group: "World peaks",
      elevationM: data.elevation ?? null,
      prominenceM: data.prominence ?? null,
    });
    setForm({ ...EMPTY });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={
            className ??
            "inline-flex items-center gap-1 text-xs text-primary hover:underline"
          }
        >
          <Plus className="w-3 h-3" /> Can't find a peak or place? Add your own
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider">Add a peak or place</DialogTitle>
          <DialogDescription>
            It goes straight into the shared world database so everyone can log it. Pull the
            details from Peakbagger, then check them before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="ap-name">Name</Label>
            <Input
              id="ap-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              maxLength={160}
              placeholder="Babia Góra"
            />
          </div>

          <div className="rounded-md border border-border p-3 space-y-2">
            <Label htmlFor="ap-pb">Peakbagger link or peak ID (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="ap-pb"
                value={form.peakbaggerId}
                onChange={(e) => set("peakbaggerId", e.target.value)}
                placeholder="https://peakbagger.com/peak.aspx?pid=11423"
              />
              <Button type="button" variant="secondary" onClick={pullFromPeakbagger} disabled={pulling}>
                {pulling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span className="ml-1 hidden sm:inline">Pull info</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave it blank to search Peakbagger by the name above.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ap-country">Country code</Label>
              <Input id="ap-country" value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="PL" />
            </div>
            <div>
              <Label htmlFor="ap-admin1">Region</Label>
              <Input id="ap-admin1" value={form.admin1} onChange={(e) => set("admin1", e.target.value)} placeholder="Lesser Poland" />
            </div>
            <div>
              <Label htmlFor="ap-elev">Elevation (m)</Label>
              <Input id="ap-elev" inputMode="decimal" value={form.elevation} onChange={(e) => set("elevation", e.target.value)} placeholder="1725" />
            </div>
            <div>
              <Label htmlFor="ap-prom">Prominence (m)</Label>
              <Input id="ap-prom" inputMode="decimal" value={form.prominence} onChange={(e) => set("prominence", e.target.value)} placeholder="1013" />
            </div>
            <div>
              <Label htmlFor="ap-lat">Latitude</Label>
              <Input id="ap-lat" inputMode="decimal" value={form.lat} onChange={(e) => set("lat", e.target.value)} placeholder="49.5732" />
            </div>
            <div>
              <Label htmlFor="ap-lon">Longitude</Label>
              <Input id="ap-lon" inputMode="decimal" value={form.lon} onChange={(e) => set("lon", e.target.value)} placeholder="19.5296" />
            </div>
            <div>
              <Label htmlFor="ap-fad">First ascent (date or year)</Label>
              <Input id="ap-fad" value={form.firstAscentDate} onChange={(e) => set("firstAscentDate", e.target.value)} placeholder="1782" />
            </div>
            <div>
              <Label htmlFor="ap-fab">First ascent by</Label>
              <Input id="ap-fab" value={form.firstAscentBy} onChange={(e) => set("firstAscentBy", e.target.value)} placeholder="Name(s)" />
            </div>
          </div>

          <div>
            <Label htmlFor="ap-notes">Notes (optional)</Label>
            <Textarea
              id="ap-notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              maxLength={800}
              rows={3}
              placeholder="Access, routes, permits, sources…"
            />
          </div>

          <Button type="button" onClick={save} disabled={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span className="ml-1">Add to the database</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddPeakDialog;
