import { fuzzyMatch } from "@/lib/fuzzy";
import { useListDensity } from "@/hooks/useListDensity";
import DensityToggle from "@/components/community/DensityToggle";
import { sortAscents } from "@/lib/sorting";
import { useEffect, useMemo, useState } from "react";
import Seo from "@/components/Seo";
import { Mountain, RefreshCw } from "lucide-react";
import CommunityLayout from "@/components/community/CommunityLayout";
import MembersOnly from "@/components/community/MembersOnly";
import AscentCard from "@/components/community/AscentCard";
import AscentForm from "@/components/community/AscentForm";
import AscentFilters, { emptyAscentFilters, type AscentFilterState } from "@/components/community/AscentFilters";
import PeakbaggerImport from "@/components/community/PeakbaggerImport";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCommunityData } from "@/hooks/useCommunityData";
import { useAscentCheers } from "@/hooks/useAscentCheers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Ascent } from "@/lib/peak-catalog";


const AscentsPage = () => {
  const { user } = useAuth();
  const { ascents, profiles, fetching, reload } = useCommunityData();
  const { counts: cheerCounts, mine: myCheers, cheerers, toggleCheer } = useAscentCheers();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Ascent | null>(null);
  const [showPeakbagger, setShowPeakbagger] = useState(false);
  const [filters, setFilters] = useState<AscentFilterState>(emptyAscentFilters);
  const [initialPeakKey, setInitialPeakKey] = useState<string>("");
  const [inviterId, setInviterId] = useState<string>("");
  const [editId, setEditId] = useState<string | null>(null);


  // Deep link from the app's centre "+" tab / home-screen shortcut.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "1") setShowForm(true);
    const peak = params.get("peak");
    if (peak) setInitialPeakKey(peak);
    // Invite link from a climbing partner: pre-link them as co-climber.
    const from = params.get("from");
    if (from) {
      setInviterId(from);
      setShowForm(true);
    }
    const editId = params.get("edit");
    if (editId) setEditId(editId);
  }, []);

  // Deep link from "My adventures" → edit this ascent.
  useEffect(() => {
    if (!editId) return;
    const target = ascents.find((a) => a.id === editId);
    if (!target) return;
    setEditing(target);
    setShowForm(true);
    setEditId(null);
  }, [editId, ascents]);

  const myAscents = useMemo(
    () => (user ? ascents.filter((a) => a.user_id === user.id) : []),
    [ascents, user],
  );

  const members = useMemo(() => {
    const ids = Array.from(new Set(ascents.map((a) => a.user_id)));
    return ids
      .map((id) => ({ id, name: profiles[id]?.display_name ?? "Member" }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [ascents, profiles]);

  const years = useMemo(
    () => Array.from(new Set(ascents.map((a) => a.ascent_date.slice(0, 4)))).sort().reverse(),
    [ascents],
  );

  const visible = useMemo(() => {
    const q = filters.query.trim();
    const matched = ascents.filter((a) => {
      if (filters.member !== "all" && a.user_id !== filters.member) return false;
      if (filters.type !== "all" && a.peak_type !== filters.type) return false;
      if (filters.year !== "all" && !a.ascent_date.startsWith(filters.year)) return false;
      if (!q) return true;
      return fuzzyMatch(q, a.peak_name, a.country, a.route, a.trip_report);
    });
    return sortAscents(matched, filters.sort);
  }, [ascents, filters]);
  const [density, setDensity] = useListDensity("ascents", visible.length);


  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("ascents").delete().eq("id", id);
    if (error) {
      toast({ title: "Could not delete", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Ascent removed" });
    reload();
  };

  if (!user) {
    return (
      <CommunityLayout>
      <Seo
        title="Ascent Log — Country High Points & Famous Peaks"
        description="Every ascent logged by Ticklelist members: country high points, famous peaks, routes, dates and trip reports in one feed."
        noindex
      />
        <MembersOnly title="Ascent log is members only" description="Sign in to browse every ascent logged by Ticklelist members." />
      </CommunityLayout>
    );
  }

  return (
    <CommunityLayout>
      <Seo
        title="Ascent Log — Country High Points & Famous Peaks"
        description="Every ascent logged by Ticklelist members: country high points, famous peaks, routes, dates and trip reports in one feed."
        noindex
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-display text-2xl tracking-wider">Ascent log</h1>
        {user && (
          <div className="flex gap-2">
            <Button onClick={() => { setEditing(null); setShowForm((v) => !v); setShowPeakbagger(false); }}>
              <Mountain className="w-4 h-4 mr-1" /> Log an ascent
            </Button>
            <Button variant="secondary" onClick={() => { setShowPeakbagger((v) => !v); setShowForm(false); }}>
              <RefreshCw className="w-4 h-4 mr-1" /> Sync from Peakbagger
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {showForm && user && (
          <AscentForm
            key={editing?.id ?? initialPeakKey}
            userId={user.id}
            initialPeakKey={initialPeakKey || undefined}
            initialPartnerId={inviterId && inviterId !== user?.id ? inviterId : undefined}
            editing={editing ?? undefined}
            onCreated={() => { setShowForm(false); setEditing(null); reload(); }}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        )}

        {showPeakbagger && user && (
          <PeakbaggerImport userId={user.id} onImported={() => { setShowPeakbagger(false); reload(); }} onCancel={() => setShowPeakbagger(false)} />
        )}

        {fetching ? (
          <p className="text-muted-foreground text-sm">Loading ascents…</p>
        ) : ascents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-10 text-center">
            <h2 className="font-display tracking-wider text-lg">No ascents logged yet</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Log a country high point or a famous peak — add the date, route and a trip report.
            </p>
          </div>
        ) : (
          <>
            <AscentFilters
              value={filters}
              onChange={setFilters}
              members={members}
              years={years}
              resultCount={visible.length}
              totalCount={ascents.length}
            />
            {visible.length === 0 ? (
              <p className="text-sm text-muted-foreground">No ascents match these filters.</p>
            ) : (
              <>
                {visible.length > 3 && (
                  <div className="flex items-center justify-end">
                    <DensityToggle value={density} onChange={setDensity} />
                  </div>
                )}
                {density !== "large" ? (
                  <ul className="grid sm:grid-cols-2 gap-2">
                    {visible.map((a) => (
                      <li key={a.id}>
                        <AscentCard
                          density={density}
                          ascent={a}
                          profile={profiles[a.user_id]}
                          currentUserId={user?.id ?? null}
                          onDelete={handleDelete}
                          onEdit={(asc) => { setEditing(asc); setShowForm(true); setShowPeakbagger(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                          cheerCount={cheerCounts[a.id] ?? 0}
                          cheered={myCheers.has(a.id)}
                          onCheer={toggleCheer}
                          profiles={profiles}
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  visible.map((a) => (
                    <AscentCard
                      key={a.id}
                      ascent={a}
                      profile={profiles[a.user_id]}
                      currentUserId={user?.id ?? null}
                      onDelete={handleDelete}
                      onEdit={(asc) => { setEditing(asc); setShowForm(true); setShowPeakbagger(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      cheerCount={cheerCounts[a.id] ?? 0}
                      cheered={myCheers.has(a.id)}
                      onCheer={toggleCheer}
                      cheerers={cheerers[a.id]}
                      profiles={profiles}
                    />
                  ))
                )}
              </>
            )}
          </>
        )}
      </div>
    </CommunityLayout>
  );
};

export default AscentsPage;
