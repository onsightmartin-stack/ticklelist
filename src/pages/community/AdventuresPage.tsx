import { useState } from "react";
import { useListDensity } from "@/hooks/useListDensity";
import DensityToggle from "@/components/community/DensityToggle";
import Seo from "@/components/Seo";
import { Plus } from "lucide-react";
import CommunityLayout from "@/components/community/CommunityLayout";
import MembersOnly from "@/components/community/MembersOnly";
import AdventureCard from "@/components/community/AdventureCard";
import AdventureForm from "@/components/community/AdventureForm";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCommunityData } from "@/hooks/useCommunityData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const AdventuresPage = () => {
  const { user } = useAuth();
  const { adventures, signups, profiles, fetching, reload } = useCommunityData();
  const [showForm, setShowForm] = useState(false);
  const [density, setDensity] = useListDensity("adventures", adventures.length);

  const handleSignUp = async (adventureId: string, status: "interested" | "joining") => {
    if (!user) return;
    const { error } = await supabase
      .from("adventure_signups")
      .upsert({ adventure_id: adventureId, user_id: user.id, status }, { onConflict: "adventure_id,user_id" });
    if (error) {
      toast({ title: "Could not sign up", description: error.message, variant: "destructive" });
      return;
    }
    reload();
  };

  const handleWithdraw = async (adventureId: string) => {
    if (!user) return;
    await supabase.from("adventure_signups").delete().eq("adventure_id", adventureId).eq("user_id", user.id);
    reload();
  };

  const handleDelete = async (adventureId: string) => {
    const { error } = await supabase.from("adventures").delete().eq("id", adventureId);
    if (error) {
      toast({ title: "Could not delete", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Adventure removed" });
    reload();
  };

  if (!user) {
    return (
      <CommunityLayout>
      <Seo
        title="Climbing Partners & Planned Trips — Ticklelist"
        description="Browse upcoming expeditions posted by Ticklelist members and sign up as interested or committed to join the rope team."
        noindex
      />
        <MembersOnly title="Adventures are members only" description="Sign in to see planned trips and sign up as interested or committed." />
      </CommunityLayout>
    );
  }

  return (
    <CommunityLayout>
      <Seo
        title="Climbing Partners & Planned Trips — Ticklelist"
        description="Browse upcoming expeditions posted by Ticklelist members and sign up as interested or committed to join the rope team."
        noindex
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-display text-2xl tracking-wider">Plan / Join adventures</h1>
        {user && (
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus className="w-4 h-4 mr-1" /> Post an adventure
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {showForm && user && (
          <AdventureForm userId={user.id} onCreated={() => { setShowForm(false); reload(); }} onCancel={() => setShowForm(false)} />
        )}

        {fetching ? (
          <p className="text-muted-foreground text-sm">Loading adventures…</p>
        ) : adventures.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-10 text-center">
            <h2 className="font-display tracking-wider text-lg">No adventures posted yet</h2>
            <p className="text-sm text-muted-foreground mt-2">Be the first — post a peak you want to climb and see who joins.</p>
          </div>
        ) : (
          <>
            {adventures.length > 3 && (
              <div className="flex items-center justify-end">
                <DensityToggle value={density} onChange={setDensity} />
              </div>
            )}
            {density !== "large" ? (
              <ul className="grid sm:grid-cols-2 gap-2">
                {adventures.map((a) => (
                  <li key={a.id}>
                    <AdventureCard
                      density={density}
                      adventure={a}
                      signups={signups.filter((s) => s.adventure_id === a.id)}
                      profiles={profiles}
                      currentUserId={user?.id ?? null}
                      onSignUp={handleSignUp}
                      onWithdraw={handleWithdraw}
                      onDelete={handleDelete}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              adventures.map((a) => (
                <AdventureCard
                  key={a.id}
                  adventure={a}
                  signups={signups.filter((s) => s.adventure_id === a.id)}
                  profiles={profiles}
                  currentUserId={user?.id ?? null}
                  onSignUp={handleSignUp}
                  onWithdraw={handleWithdraw}
                  onDelete={handleDelete}
                />
              ))
            )}
          </>
        )}
      </div>
    </CommunityLayout>
  );
};

export default AdventuresPage;
