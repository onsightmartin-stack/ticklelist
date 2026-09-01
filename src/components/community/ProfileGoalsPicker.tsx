import { useEffect, useMemo, useState } from "react";
import { Check, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { fuzzyMatch } from "@/lib/fuzzy";
import { MAX_PROFILE_GOALS, defaultGoals, goalDefs, suggestGoals } from "@/lib/profile-goals";
import type { Ascent } from "@/lib/peak-catalog";
import type { Visit } from "@/data/places";

interface Props {
  userId: string;
  initial?: string[] | null | undefined;
  onSaved?: (goals: string[]) => void;
}

/** Lets a member choose up to four progress boxes shown on their profile. */
const ProfileGoalsPicker = ({ userId, initial, onSaved }: Props) => {
  const [selected, setSelected] = useState<string[]>(initial?.length ? initial : defaultGoals);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  const suggest = async () => {
    setSuggesting(true);
    const [{ data: ascents }, { data: visits }] = await Promise.all([
      supabase.from("ascents").select("*").eq("user_id", userId),
      supabase.from("visits").select("*").eq("user_id", userId),
    ]);
    const picks = suggestGoals((ascents as Ascent[]) ?? [], (visits as Visit[]) ?? []);
    setSuggesting(false);
    setSelected(picks);
    const names = picks.map((id) => goalDefs.find((g) => g.id === id)?.short ?? id).join(", ");
    toast({ title: "Here are four goals for you", description: `${names} — tweak them, then save.` });
  };

  useEffect(() => {
    if (initial?.length) setSelected(initial);
  }, [initial]);

  const groups = useMemo(() => {
    const q = query.trim();
    const matched = q ? goalDefs.filter((g) => fuzzyMatch(q, g.label, g.group)) : goalDefs;
    const map = new Map<string, typeof goalDefs>();
    matched.forEach((g) => {
      const arr = map.get(g.group) ?? [];
      arr.push(g);
      map.set(g.group, arr);
    });
    return [...map.entries()];
  }, [query]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_PROFILE_GOALS) {
        toast({ title: `Pick up to ${MAX_PROFILE_GOALS} goals`, description: "Remove one first." });
        return prev;
      }
      return [...prev, id];
    });
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ profile_goals: selected }).eq("id", userId);
    setSaving(false);
    if (error) {
      toast({ title: "Could not save goals", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Profile goals saved" });
    onSaved?.(selected);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-primary" />
        <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-display">Profile goals</p>
      </div>
      <p className="text-sm text-muted-foreground mt-1 mb-3">
        Choose up to {MAX_PROFILE_GOALS} goals to show as progress boxes on your public profile.
      </p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {selected.map((id) => {
          const def = goalDefs.find((g) => g.id === id);
          return (
            <button
              key={id}
              onClick={() => toggle(id)}
              className="rounded-full border border-primary/50 bg-primary/10 text-primary px-2.5 py-1 text-xs"
            >
              {def?.short ?? id} ×
            </button>
          );
        })}
        {selected.length === 0 && <p className="text-xs text-muted-foreground">Nothing picked yet.</p>}
      </div>

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search goals — 7 summits, volcanic, wonders…"
        aria-label="Search goals"
        className="mb-3"
      />

      <div className="max-h-72 overflow-y-auto pr-1 space-y-3">
        {groups.map(([group, defs]) => (
          <div key={group}>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">{group}</p>
            <div className="flex flex-wrap gap-1.5">
              {defs.map((g) => {
                const on = selected.includes(g.id);
                return (
                  <button
                    key={g.id}
                    onClick={() => toggle(g.id)}
                    aria-pressed={on}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs transition-colors",
                      on
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {on && <Check className="w-3 h-3 mr-1 inline" />}
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save goals"}
        </Button>
        <Button size="sm" variant="outline" onClick={suggest} disabled={suggesting}>
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          {suggesting ? "Thinking…" : "Suggest goals for me"}
        </Button>
      </div>
    </div>
  );
};

export default ProfileGoalsPicker;
