import { useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { peakbaggerImport } from "@/lib/peakbagger-import.functions";
import {
  matchPeakbaggerRows,
  parsePeakbaggerText,
  type MatchedAscent,
  type PeakbaggerRow,
} from "@/lib/peakbagger";

interface PeakbaggerImportProps {
  userId: string;
  onImported: () => void;
  onCancel: () => void;
}

const PeakbaggerImport = ({ userId, onImported, onCancel }: PeakbaggerImportProps) => {
  const [name, setName] = useState("");
  const [pasted, setPasted] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [candidates, setCandidates] = useState<{ cid: string; name: string }[]>([]);
  const [matched, setMatched] = useState<MatchedAscent[] | null>(null);
  const [skipped, setSkipped] = useState<PeakbaggerRow[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [famousToo, setFamousToo] = useState(true);
  const [fromYear, setFromYear] = useState("");
  const [toYear, setToYear] = useState("");
  const [busy, setBusy] = useState(false);

  const yearRange = () => {
    const inRange = (v: string) => /^\d{4}$/.test(v.trim());
    return {
      ...(inRange(fromYear) ? { fromYear: Number(fromYear) } : {}),
      ...(inRange(toYear) ? { toYear: Number(toYear) } : {}),
    };
  };

  const buildPreview = (rows: PeakbaggerRow[]) => {
    const { fromYear: lo, toYear: hi } = yearRange();
    const ranged =
      lo === undefined && hi === undefined
        ? rows
        : rows.filter((r) => {
            const y = Number(String(r.date).slice(0, 4));
            return y >= (lo ?? -Infinity) && y <= (hi ?? Infinity);
          });
    const all = matchPeakbaggerRows(ranged);
    const hits = all.filter((m) => m.matches.length > 0);
    setSkipped(all.filter((m) => m.matches.length === 0).map((m) => m.row));
    setMatched(hits);
    const sel: Record<string, boolean> = {};
    hits.forEach((m) => m.matches.forEach((p) => { sel[`${p.key}|${m.row.date}`] = true; }));
    setSelected(sel);
    if (hits.length === 0) {
      toast({ title: "No country high points or famous peaks found in that list" });
    }
  };

  const fetchFromPeakbagger = async (cid?: string) => {
    if (!name.trim() && !cid) {
      toast({ title: "Paste your Peakbagger profile link or climber id", variant: "destructive" });
      return;
    }
    setBusy(true);
    setCandidates([]);
    let data: Awaited<ReturnType<typeof peakbaggerImport>> | null = null;
    try {
      data = await peakbaggerImport({
        data: cid
          ? { cid, ...yearRange() }
          : { cid: name.trim(), name: name.trim(), ...yearRange() },
      });

    } catch (err) {
      setBusy(false);
      toast({
        title: "Sync failed",
        description: err instanceof Error ? err.message : "Unexpected error",
        variant: "destructive",
      });
      setShowPaste(true);
      return;
    }
    setBusy(false);

    if (data?.blocked) {
      setShowPaste(true);
      toast({
        title: "Peakbagger blocked the automatic fetch",
        description: "Paste your ascent list below instead — it imports the same way.",
      });
      return;
    }
    if (data?.error) {
      toast({ title: "Sync failed", description: data.error, variant: "destructive" });
      return;
    }
    if (data?.candidates?.length) {
      setCandidates(data.candidates);
      return;
    }
    buildPreview((data?.rows ?? []) as PeakbaggerRow[]);
  };

  const importSelected = async () => {
    if (!matched) return;
    const rows = matched
      .flatMap((m) => m.matches.map((p) => ({ p, date: m.row.date })))
      .filter(({ p, date }) => selected[`${p.key}|${date}`])
      .filter(({ p }) => famousToo || p.type === "country_highpoint");

    if (rows.length === 0) {
      toast({ title: "Nothing selected to import", variant: "destructive" });
      return;
    }

    setBusy(true);
    let imported = 0;
    let skipped = 0;
    let failure: string | null = null;

    for (const { p, date } of rows) {
      const { error } = await supabase.from("ascents").insert({
        user_id: userId,
        peak_name: p.name,
        peak_type: p.type,
        country: p.country,
        elevation: p.elevation,
        ascent_date: date,
        route: null,
        trip_report: "Imported from Peakbagger",
        is_public: true,
      });
      if (!error) {
        imported += 1;
      } else if (error.code === "23505" || error.message.includes("ascents_unique_per_day")) {
        skipped += 1;
      } else {
        failure = error.message;
        break;
      }
    }
    setBusy(false);

    if (failure) {
      toast({ title: "Import failed", description: failure, variant: "destructive" });
      return;
    }
    toast({
      title: `Imported ${imported} ascent${imported === 1 ? "" : "s"} 🏔️`,
      description: skipped > 0 ? `${skipped} already logged — skipped duplicates.` : undefined,
    });
    onImported();
  };


  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <h2 className="font-display tracking-wider text-lg">Sync from Peakbagger</h2>
      <p className="text-xs text-muted-foreground -mt-2">
        Open your Peakbagger profile and copy the link — it ends with{" "}
        <code className="text-foreground">cid=12345</code>. Paste it (or just the number) below and
        we'll pull your logged ascents, keep the country high points and famous peaks, and add them
        to your community log.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="pb-name">Peakbagger profile link or climber id</Label>
          <Input
            id="pb-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="https://peakbagger.com/climber/climber.aspx?cid=42297"
          />
        </div>

        <div className="flex gap-2 items-end">
          <div className="space-y-2">
            <Label htmlFor="pb-from">From year</Label>
            <Input
              id="pb-from"
              inputMode="numeric"
              className="w-24"
              value={fromYear}
              onChange={(e) => setFromYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="Any"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pb-to">To year</Label>
            <Input
              id="pb-to"
              inputMode="numeric"
              className="w-24"
              value={toYear}
              onChange={(e) => setToYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="Any"
            />
          </div>
        </div>

        <Button type="button" onClick={() => fetchFromPeakbagger()} disabled={busy}>
          <RefreshCw className={`w-4 h-4 mr-1 ${busy ? "animate-spin" : ""}`} />
          {busy ? "Syncing…" : "Sync"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Year range is optional — leave both empty to import every year.
      </p>


      {candidates.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Several climbers match — pick yours:</p>
          <div className="flex flex-wrap gap-2">
            {candidates.map((c) => (
              <Button key={c.cid} type="button" variant="outline" size="sm" onClick={() => fetchFromPeakbagger(c.cid)}>
                {c.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowPaste((v) => !v)}
        className="text-xs underline text-muted-foreground hover:text-foreground"
      >
        {showPaste ? "Hide manual paste" : "Peakbagger blocking the sync? Paste your list instead"}
      </button>

      {showPaste && (
        <div className="space-y-2">
          <Label htmlFor="pb-paste">Paste your Peakbagger ascent list</Label>
          <Textarea
            id="pb-paste"
            rows={6}
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder={"Carrauntoohil\t1038\tIreland\t2026-07-11\nBen Nevis\t1345\tScotland\t2026-07-17"}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => buildPreview(parsePeakbaggerText(pasted))}
          >
            <Download className="w-4 h-4 mr-1" /> Read list
          </Button>
        </div>
      )}

      {matched && matched.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-border">
          <div className="flex items-center gap-3">
            <Switch id="pb-famous" checked={famousToo} onCheckedChange={setFamousToo} />
            <Label htmlFor="pb-famous" className="font-normal text-sm text-muted-foreground">
              Also import famous peaks (not just country high points)
            </Label>
          </div>

          <div className="max-h-72 overflow-y-auto rounded-md border border-border divide-y divide-border">
            {matched.flatMap((m) =>
              m.matches
                .filter((p) => famousToo || p.type === "country_highpoint")
                .map((p) => {
                  const id = `${p.key}|${m.row.date}`;
                  return (
                    <label key={id} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!selected[id]}
                        onChange={(e) => setSelected((s) => ({ ...s, [id]: e.target.checked }))}
                        className="accent-primary"
                      />
                      <span className="flex-1">
                        {p.name}
                        <span className="text-muted-foreground"> · {p.country}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">{m.row.date}</span>
                    </label>
                  );
                }),
            )}
          </div>

          {skipped.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Skipped {skipped.length} ascent{skipped.length === 1 ? "" : "s"} not in the catalog
              (e.g. {skipped.slice(0, 3).map((s) => s.peak).join(", ")}).
            </p>
          )}

          <Button type="button" onClick={importSelected} disabled={busy}>
            {busy ? "Importing…" : "Import selected"}
          </Button>
        </div>
      )}

      <div>
        <Button type="button" variant="ghost" onClick={onCancel}>Close</Button>
      </div>
    </div>
  );
};

export default PeakbaggerImport;
