import { useRef, useState } from "react";
import { Upload, FileUp, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import Seo from "@/components/Seo";
import CommunityLayout from "@/components/community/CommunityLayout";
import MembersOnly from "@/components/community/MembersOnly";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { importPeaks, type ImportPeaksResult } from "@/lib/peak-import.functions";
import { parsePeakFile, SAMPLE_CSV, type ImportPeak } from "@/lib/peak-import";

/** Admin-only bulk peak importer: CSV or JSON straight into the global catalog. */
const PeakImportPage = () => {
  const { user, isAdmin } = useAuth();
  const runImport = useServerFn(importPeaks);
  const fileRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("pasted");
  const [rows, setRows] = useState<ImportPeak[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportPeaksResult | null>(null);

  const preview = (raw: string, name: string) => {
    setFileName(name);
    setResult(null);
    const parsed = parsePeakFile(raw);
    setRows(parsed.rows);
    setErrors(parsed.errors);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5_000_000) {
      toast.error("That file is over 5 MB — split it into smaller batches.");
      return;
    }
    const raw = await file.text();
    setText(raw.length > 200_000 ? `${raw.slice(0, 200_000)}\n…` : raw);
    preview(raw, file.name);
  };

  const submit = async () => {
    if (rows.length === 0) return;
    setBusy(true);
    try {
      const res = await runImport({ data: { peaks: rows, source: fileName } });
      setResult(res);
      if (res.inserted > 0) toast.success(`Added ${res.inserted} peaks to the catalog.`);
      else toast.error("Nothing was added — see the report below.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  };

  if (!user || !isAdmin) {
    return (
      <CommunityLayout>
        <Seo title="Peak import — Ticklelist" description="Admin tool for bulk-adding peaks." path="/community/import-peaks" noindex />
        <MembersOnly title="Admins only" description="Bulk peak imports are reserved for site admins." />
      </CommunityLayout>
    );
  }

  return (
    <CommunityLayout>
      <Seo title="Peak import — Ticklelist" description="Bulk-add peaks to the Ticklelist catalog from CSV or JSON." path="/community/import-peaks" noindex />

      <header className="mb-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-primary font-display">Ticklelist</p>
        <h1 className="font-display text-3xl md:text-4xl tracking-wider mt-2 flex items-center gap-2">
          <Upload className="w-7 h-7 text-primary" /> Peak import
        </h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">
          Upload a CSV or JSON file of peaks and they go straight into the global search
          catalog. Only <code className="text-foreground">name</code> is required;{" "}
          <code className="text-foreground">elevation</code>, <code className="text-foreground">lat</code>,{" "}
          <code className="text-foreground">lon</code>, <code className="text-foreground">country</code> and{" "}
          <code className="text-foreground">region</code> are optional. Up to 5,000 rows per import.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.json,.txt,text/csv,application/json"
          className="hidden"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
        <Button onClick={() => fileRef.current?.click()} variant="default">
          <FileUp className="w-4 h-4 mr-2" /> Choose file
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setText(SAMPLE_CSV);
            preview(SAMPLE_CSV, "sample.csv");
          }}
        >
          Load example
        </Button>
        <span className="text-xs text-muted-foreground">{fileName}</span>
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => text.trim() && preview(text, fileName)}
        rows={10}
        spellCheck={false}
        placeholder={SAMPLE_CSV}
        className="font-mono text-xs"
      />

      <div className="flex flex-wrap items-center gap-3 mt-3">
        <Button variant="outline" onClick={() => preview(text, fileName)} disabled={!text.trim()}>
          Check file
        </Button>
        <Button onClick={() => void submit()} disabled={busy || rows.length === 0}>
          {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
          Import {rows.length > 0 ? `${rows.length} peaks` : ""}
        </Button>
      </div>

      {errors.length > 0 && (
        <div className="mt-5 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-destructive">
            <AlertTriangle className="w-4 h-4" /> {errors.length} row problem{errors.length === 1 ? "" : "s"}
          </p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground max-h-48 overflow-auto">
            {errors.slice(0, 50).map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-5 rounded-lg border border-border overflow-hidden">
          <p className="px-4 py-2 text-xs uppercase tracking-widest text-muted-foreground border-b border-border">
            Preview — {rows.length} peaks ready
          </p>
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Elev.</th>
                  <th className="px-4 py-2">Country</th>
                  <th className="px-4 py-2">Region</th>
                  <th className="px-4 py-2">Coords</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 200).map((p, i) => (
                  <tr key={`${p.name}-${i}`} className="border-t border-border/60">
                    <td className="px-4 py-1.5">{p.name}</td>
                    <td className="px-4 py-1.5">{p.elevation ? `${p.elevation} m` : "—"}</td>
                    <td className="px-4 py-1.5">{p.country_code ?? "—"}</td>
                    <td className="px-4 py-1.5">{p.admin1 ?? "—"}</td>
                    <td className="px-4 py-1.5 text-xs text-muted-foreground">
                      {p.lat !== null && p.lon !== null ? `${p.lat.toFixed(3)}, ${p.lon.toFixed(3)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-5 rounded-lg border border-border p-4">
          <p className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            {result.inserted} added · {result.skipped} skipped
          </p>
          {result.messages.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground max-h-48 overflow-auto">
              {result.messages.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Imported peaks are searchable immediately from every search box on the site.
          </p>
        </div>
      )}
    </CommunityLayout>
  );
};

export default PeakImportPage;
