import { useEffect, useMemo, useState } from "react";
import { Check, Link2, Plus, UserPlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { fuzzyMatch } from "@/lib/fuzzy";
import { cn } from "@/lib/utils";
import { communityHref } from "@/lib/site-links";

interface PartnerProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

interface ClimbPartnersProps {
  /** Signed-in member — never offered as their own co-climber. */
  userId: string;
  partnerIds: string[];
  partnerNames: string[];
  withGroup: boolean;
  onChange: (next: { partnerIds: string[]; partnerNames: string[]; withGroup: boolean }) => void;
  /** Catalog key of the picked peak, used to pre-fill the invite link. */
  peakKey?: string | undefined;
  peakName?: string | undefined;
  /** Heading shown above the picker. */
  label?: string | undefined;
  /** Hide the free-text name field (e.g. when only members can be invited). */
  hideNames?: boolean | undefined;
  /** Hide the "with a group" switch. */
  hideGroup?: boolean | undefined;
  /** Placeholder for the member search field. */
  searchPlaceholder?: string | undefined;
}

/**
 * Co-climber picker: link Ticklelist members, add names of friends who aren't
 * members yet, flag a group outing, and share an invite link that opens the
 * ascent form with the same peak pre-filled.
 */
const ClimbPartners = ({
  userId,
  partnerIds,
  partnerNames,
  withGroup,
  onChange,
  peakKey,
  peakName,
  label,
  hideNames = false,
  hideGroup = false,
  searchPlaceholder,
}: ClimbPartnersProps) => {
  const [members, setMembers] = useState<PartnerProfile[]>([]);
  const [query, setQuery] = useState("");
  const [nameDraft, setNameDraft] = useState("");

  useEffect(() => {
    let alive = true;
    void supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .limit(1000)
      .then(({ data }) => {
        if (alive && data) setMembers(data as PartnerProfile[]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const suggestions = useMemo(() => {
    const q = query.trim();
    if (q.length < 1) return [];
    return members
      .filter((m) => m.id !== userId && !partnerIds.includes(m.id))
      .filter((m) => fuzzyMatch(q, m.display_name))
      .slice(0, 6);
  }, [query, members, partnerIds, userId]);

  const addMember = (id: string) => {
    onChange({ partnerIds: [...partnerIds, id], partnerNames, withGroup });
    setQuery("");
  };

  const removeMember = (id: string) =>
    onChange({ partnerIds: partnerIds.filter((p) => p !== id), partnerNames, withGroup });

  const addName = () => {
    const n = nameDraft.trim().slice(0, 60);
    if (!n) return;
    if (partnerNames.some((x) => x.toLowerCase() === n.toLowerCase())) {
      setNameDraft("");
      return;
    }
    onChange({ partnerIds, partnerNames: [...partnerNames, n], withGroup });
    setNameDraft("");
  };

  const removeName = (n: string) =>
    onChange({ partnerIds, partnerNames: partnerNames.filter((x) => x !== n), withGroup });

  const inviteLink = useMemo(() => {
    const params = new URLSearchParams({ new: "1", from: userId });
    if (peakKey) params.set("peak", peakKey);
    const href = communityHref("/ascents");
    const base = href.startsWith("http")
      ? href
      : `${typeof window === "undefined" ? "https://ticklelist.org" : window.location.origin}${href}`;
    return `${base}?${params.toString()}`;
  }, [peakKey, userId]);

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast({
        title: "Invite link copied 🔗",
        description: peakName
          ? `Send it to your climbing partner — it opens Ticklelist with ${peakName} ready to log.`
          : "Send it to your climbing partner to join Ticklelist and log this one too.",
      });
    } catch {
      toast({ title: "Copy failed", description: inviteLink, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-border/70 bg-background/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" /> {label ?? "Co-climbers (optional)"}
        </Label>
        <Button type="button" variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => void copyInvite()}>
          <Link2 className="w-3.5 h-3.5" /> Invite link
        </Button>
      </div>

      {(partnerIds.length > 0 || partnerNames.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {partnerIds.map((id) => (
            <Badge key={id} variant="secondary" className="gap-1">
              {byId.get(id)?.display_name ?? "Member"}
              <button type="button" onClick={() => removeMember(id)} aria-label="Remove co-climber">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          {partnerNames.map((n) => (
            <Badge key={n} variant="outline" className="gap-1">
              {n}
              <button type="button" onClick={() => removeName(n)} aria-label={`Remove ${n}`}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="relative">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder ?? "Search members you climbed with…"}
        />
        {suggestions.length > 0 && (
          <div className="absolute z-20 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
            {suggestions.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => addMember(m.id)}
                className={cn("w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center justify-between")}
              >
                {m.display_name}
                <Check className="w-3.5 h-3.5 opacity-40" />
              </button>
            ))}
          </div>
        )}
      </div>

      {!hideNames && (
        <div className="flex gap-2">
          <Input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addName();
              }
            }}
            placeholder="…or just a name (not a member yet)"
          />
          <Button type="button" variant="outline" className="shrink-0" onClick={addName}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}

      {!hideGroup && (
        <div className="flex items-center gap-3">
          <Switch
            id="ascent-group"
            checked={withGroup}
            onCheckedChange={(v) => onChange({ partnerIds, partnerNames, withGroup: v })}
          />
          <Label htmlFor="ascent-group" className="font-normal text-sm text-muted-foreground">
            Climbed with a group / organised party
          </Label>
        </div>
      )}
    </div>
  );
};

export default ClimbPartners;
