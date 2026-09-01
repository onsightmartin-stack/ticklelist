import { useMemo, useState } from "react";
import { Check, Minus, Pencil, Plus, Save, Trash2, Wrench, X } from "lucide-react";

import { countries } from "@/data/countries";
import { peakCatalog } from "@/lib/peak-catalog";
import {
  countryDefinitions,
  countrySetFor,
  deletePreset,
  listPresets,
  savePreset,
  type CountryDefinitionId,
  type CustomPreset,
} from "@/lib/definitions";
import { useDefinitions } from "@/hooks/useDefinitions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Draft = Omit<CustomPreset, "id"> & { id?: string };

const emptyDraft = (): Draft => ({
  name: "My definition",
  base: "un",
  include: [],
  exclude: [],
  peaks: [],
});

const allCountryNames = [...new Set(countries.map((c) => c.country))].sort((a, b) => a.localeCompare(b));
const famousPeaks = peakCatalog.filter((p) => p.type === "famous_peak");

/** Builds and stores member-made country definitions on this device. */
const CustomDefinitionBuilder = () => {
  const [defs, update] = useDefinitions();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [countryQuery, setCountryQuery] = useState("");
  const [peakQuery, setPeakQuery] = useState("");
  const [version, setVersion] = useState(0);

  const presets = useMemo(() => listPresets(), [version, defs]);

  const baseSet = useMemo(
    () => (draft ? countrySetFor(draft.base as CountryDefinitionId) : new Set<string>()),
    [draft],
  );
  const resultSet = useMemo(() => {
    if (!draft) return new Set<string>();
    const set = new Set(baseSet);
    draft.include.forEach((c) => set.add(c));
    draft.exclude.forEach((c) => set.delete(c));
    return set;
  }, [draft, baseSet]);

  const countryMatches = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return [];
    return allCountryNames.filter((c) => c.toLowerCase().includes(q)).slice(0, 8);
  }, [countryQuery]);

  const peakMatches = useMemo(() => {
    const q = peakQuery.trim().toLowerCase();
    if (!q) return [];
    return famousPeaks.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [peakQuery]);

  const toggleCountry = (country: string) => {
    if (!draft) return;
    const inBase = baseSet.has(country);
    setDraft({
      ...draft,
      include: inBase
        ? draft.include.filter((c) => c !== country)
        : draft.include.includes(country)
          ? draft.include.filter((c) => c !== country)
          : [...draft.include, country],
      exclude: inBase
        ? draft.exclude.includes(country)
          ? draft.exclude.filter((c) => c !== country)
          : [...draft.exclude, country]
        : draft.exclude.filter((c) => c !== country),
    });
    setCountryQuery("");
  };

  const togglePeak = (key: string) => {
    if (!draft) return;
    setDraft({
      ...draft,
      peaks: draft.peaks.includes(key) ? draft.peaks.filter((k) => k !== key) : [...draft.peaks, key],
    });
    setPeakQuery("");
  };

  const save = () => {
    if (!draft) return;
    const name = draft.name.trim() || "My definition";
    const saved = savePreset({ ...draft, name });
    update({ countries: `custom:${saved.id}` });
    setDraft(null);
    setVersion((v) => v + 1);
    toast.success(`Saved "${saved.name}" — ${countrySetFor(`custom:${saved.id}`).size} countries`);
  };

  const remove = (preset: CustomPreset) => {
    deletePreset(preset.id);
    setVersion((v) => v + 1);
    toast.success(`Deleted "${preset.name}"`);
  };

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Wrench className="w-4 h-4 text-primary" aria-hidden="true" />
        <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-display">
          Build your own definition
        </p>
      </div>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        Start from a preset, then add or drop individual countries and throw in any extra peaks you
        want counted. Save it and it appears alongside the built-in definitions.
      </p>

      {presets.length > 0 && (
        <div className="grid gap-2 mb-4">
          {presets.map((p) => {
            const active = defs.countries === `custom:${p.id}`;
            return (
              <div
                key={p.id}
                className={cn(
                  "rounded-lg border p-3 flex items-start justify-between gap-3",
                  active ? "border-primary bg-primary/10" : "border-border bg-background",
                )}
              >
                <button
                  type="button"
                  className="text-left flex-1"
                  onClick={() => update({ countries: `custom:${p.id}` })}
                  aria-pressed={active}
                >
                  <p className="font-display tracking-wider text-sm flex items-center gap-2">
                    {p.name}
                    {active && <Check className="w-4 h-4 text-primary" aria-hidden="true" />}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {countrySetFor(`custom:${p.id}`).size} countries
                    {p.peaks.length > 0 && ` + ${p.peaks.length} extra peak${p.peaks.length > 1 ? "s" : ""}`}
                    {p.include.length > 0 && ` · added ${p.include.join(", ")}`}
                    {p.exclude.length > 0 && ` · dropped ${p.exclude.join(", ")}`}
                  </p>
                </button>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${p.name}`}
                    onClick={() => setDraft({ ...p })}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${p.name}`}
                    onClick={() => remove(p)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!draft ? (
        <Button variant="secondary" size="sm" onClick={() => setDraft(emptyDraft())}>
          <Plus className="w-4 h-4 mr-1" /> New custom definition
        </Button>
      ) : (
        <div className="rounded-lg border border-border bg-background p-4 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground" htmlFor="preset-name">
              Name
            </label>
            <Input
              id="preset-name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="UN + Antarctica + Vatican"
              className="mt-1"
            />
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Start from</p>
            <div className="flex flex-wrap gap-2">
              {countryDefinitions.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDraft({ ...draft, base: d.id as Draft["base"] })}
                  className={cn(
                    "text-xs rounded-full border px-3 py-1 transition-colors",
                    draft.base === d.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/50",
                  )}
                >
                  {d.name} ({countrySetFor(d.id).size})
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Add or drop countries</p>
            <Input
              value={countryQuery}
              onChange={(e) => setCountryQuery(e.target.value)}
              placeholder="Search a country — e.g. Vatican City"
            />
            {countryMatches.length > 0 && (
              <div className="mt-2 grid gap-1">
                {countryMatches.map((c) => {
                  const included = resultSet.has(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCountry(c)}
                      className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm hover:border-primary/50"
                    >
                      <span>{c}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        {included ? (
                          <>
                            <Minus className="w-3 h-3" /> drop
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" /> add
                          </>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {(draft.include.length > 0 || draft.exclude.length > 0) && (
              <div className="flex flex-wrap gap-1 mt-2">
                {draft.include.map((c) => (
                  <button
                    key={`in-${c}`}
                    type="button"
                    onClick={() => setDraft({ ...draft, include: draft.include.filter((x) => x !== c) })}
                    className="text-[11px] rounded-full border border-primary/60 bg-primary/10 px-2 py-0.5 flex items-center gap-1"
                  >
                    + {c} <X className="w-3 h-3" />
                  </button>
                ))}
                {draft.exclude.map((c) => (
                  <button
                    key={`ex-${c}`}
                    type="button"
                    onClick={() => setDraft({ ...draft, exclude: draft.exclude.filter((x) => x !== c) })}
                    className="text-[11px] rounded-full border border-destructive/60 bg-destructive/10 px-2 py-0.5 flex items-center gap-1"
                  >
                    − {c} <X className="w-3 h-3" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Extra peaks that count (optional)</p>
            <Input
              value={peakQuery}
              onChange={(e) => setPeakQuery(e.target.value)}
              placeholder="Search a peak — e.g. Mont Blanc"
            />
            {peakMatches.length > 0 && (
              <div className="mt-2 grid gap-1">
                {peakMatches.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => togglePeak(p.key)}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm hover:border-primary/50"
                  >
                    <span>
                      {p.name} <span className="text-xs text-muted-foreground">{p.elevation}</span>
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {draft.peaks.includes(p.key) ? (
                        <>
                          <Minus className="w-3 h-3" /> remove
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" /> add
                        </>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {draft.peaks.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {draft.peaks.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => togglePeak(k)}
                    className="text-[11px] rounded-full border border-primary/60 bg-primary/10 px-2 py-0.5 flex items-center gap-1"
                  >
                    {k.replace(/^fp:/, "")} <X className="w-3 h-3" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="text-sm">
            <span className="text-muted-foreground">This definition counts </span>
            <span className="font-display tracking-wider text-primary">{resultSet.size} countries</span>
            {draft.peaks.length > 0 && (
              <span className="text-muted-foreground"> + {draft.peaks.length} extra peaks</span>
            )}
            <span className="text-muted-foreground"> — {resultSet.size + draft.peaks.length} boxes.</span>
          </p>

          <div className="flex gap-2">
            <Button size="sm" onClick={save}>
              <Save className="w-4 h-4 mr-1" /> Save & use
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDraft(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};

export default CustomDefinitionBuilder;
