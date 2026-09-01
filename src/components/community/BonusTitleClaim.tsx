import { useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { fuzzyMatch } from "@/lib/fuzzy";
import { celebrate } from "@/components/Celebration";
import { bonusTitleById, bonusTitleDefs, type BonusTitleRow } from "@/lib/bonus-titles";

interface Props {
  userId: string;
  rows: BonusTitleRow[];
  onChanged: () => void;
}

/** Claim / remove honour badges — the ones no counter can award automatically. */
const BonusTitleClaim = ({ userId, rows, onChanged }: Props) => {
  const [picking, setPicking] = useState(false);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<{ id: string; story: string; date: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const owned = useMemo(() => new Set(rows.map((r) => r.title_id)), [rows]);
  const groups = useMemo(() => {
    const q = query.trim();
    const matched = bonusTitleDefs.filter(
      (t) => !owned.has(t.id) && (!q || fuzzyMatch(q, t.title, t.criteria, t.group)),
    );
    const map = new Map<string, typeof bonusTitleDefs>();
    matched.forEach((t) => {
      const arr = map.get(t.group) ?? [];
      arr.push(t);
      map.set(t.group, arr);
    });
    return [...map.entries()];
  }, [query, owned]);

  const claim = async () => {
    if (!draft) return;
    setSaving(true);
    const { error } = await supabase.from("bonus_titles").insert({
      user_id: userId,
      title_id: draft.id,
      story: draft.story.trim() || null,
      happened_on: draft.date || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Could not add badge", description: error.message, variant: "destructive" });
      return;
    }
    celebrate();
    toast({ title: `Badge earned: ${bonusTitleById(draft.id)?.title}` });
    setDraft(null);
    setPicking(false);
    setQuery("");
    onChanged();
  };

  const remove = async (rowId: string) => {
    const { error } = await supabase.from("bonus_titles").delete().eq("id", rowId);
    if (error) {
      toast({ title: "Could not remove", description: error.message, variant: "destructive" });
      return;
    }
    onChanged();
  };

  return (
    <div className="mt-4">
      <Button size="sm" variant="secondary" onClick={() => setPicking((p) => !p)}>
        {picking ? <X className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
        {picking ? "Close" : "Claim an honour badge"}
      </Button>

      {picking && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-muted-foreground">
            Honour badges cover the things no counter measures — rescues, conflict zones, storm bivouacs. Claim them
            honestly; an admin can verify them.
          </p>

          {rows.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {rows.map((r) => (
                <span key={r.id} className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs">
                  {bonusTitleById(r.title_id)?.icon} {bonusTitleById(r.title_id)?.title ?? r.title_id}
                  <button onClick={() => remove(r.id)} aria-label="Remove badge" className="opacity-70 hover:opacity-100">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search honour badges — rescue, daredevil, winter…"
            aria-label="Search honour badges"
          />
          <div className="max-h-64 overflow-y-auto pr-1 space-y-3">
            {groups.map(([group, defs]) => (
              <div key={group}>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">{group}</p>
                <div className="space-y-1">
                  {defs.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setDraft({ id: t.id, story: "", date: "" })}
                      className={cn(
                        "w-full text-left rounded-md border px-2.5 py-1.5 text-xs transition-colors",
                        draft?.id === t.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span className="mr-1" aria-hidden>{t.icon}</span>
                      <span className="text-foreground">{t.title}</span> — {t.criteria}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {groups.length === 0 && <p className="text-xs text-muted-foreground">Nothing left to claim here.</p>}
          </div>

          {draft && (
            <div className="rounded-md border border-border p-3 space-y-2">
              <p className="text-xs text-muted-foreground">
                Claiming <span className="text-foreground">{bonusTitleById(draft.id)?.title}</span>
              </p>
              <Textarea
                value={draft.story}
                onChange={(e) => setDraft({ ...draft, story: e.target.value })}
                placeholder="What happened? (optional, but it makes the badge mean something)"
                rows={3}
              />
              <Input
                type="date"
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                aria-label="When it happened"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={claim} disabled={saving}>
                  {saving ? "Saving…" : "Earn badge"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDraft(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BonusTitleClaim;
