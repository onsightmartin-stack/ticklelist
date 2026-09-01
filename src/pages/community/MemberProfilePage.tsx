import { useEffect, useMemo, useState } from "react";
import { useListDensity } from "@/hooks/useListDensity";
import DensityToggle from "@/components/community/DensityToggle";
import Seo from "@/components/Seo";
import { Link, useParams } from "@/lib/router-compat";
import { MapPin, Mountain, Users } from "lucide-react";
import CommunityLayout from "@/components/community/CommunityLayout";

import ProfileAvatarDisplay from "@/components/community/ProfileAvatarDisplay";
import FollowButton from "@/components/community/FollowButton";
import AscentCard from "@/components/community/AscentCard";
import BadgesPanel from "@/components/community/BadgesPanel";
import AdventureCard from "@/components/community/AdventureCard";
import ProfileVisitors from "@/components/community/ProfileVisitors";
import SortSelect from "@/components/community/SortSelect";
import GoalBoxes from "@/components/community/GoalBoxes";
import { computeGoals, defaultGoals } from "@/lib/profile-goals";
import { useVisits } from "@/hooks/useVisits";
import { adventureSortOptions, ascentSortOptions, sortAdventures, sortAscents } from "@/lib/sorting";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCommunityData } from "@/hooks/useCommunityData";
import { useAscentCheers } from "@/hooks/useAscentCheers";
import { useFollows } from "@/hooks/useFollows";
import { useProfileViews } from "@/hooks/useProfileViews";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";


interface FullProfile {
  id: string;
  display_name: string;
  bio: string | null;
  country: string | null;
  avatar_url: string | null;
  created_at: string;
  profile_goals: string[] | null;
}

const MemberProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { ascents, adventures, signups, profiles, reload } = useCommunityData();
  const { following, followerCounts, toggleFollow } = useFollows();
  const { counts: cheerCounts, mine: myCheers, cheerers, toggleCheer } = useAscentCheers();
  const { visits: allVisits } = useVisits();
  const { visits, isOwner, hasMore: hasMoreVisits, loadingMore: loadingMoreVisits, loadMore: loadMoreVisits } = useProfileViews(id);

  const [member, setMember] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    supabase
      .from("profiles")
      .select("id, display_name, bio, country, avatar_url, created_at, profile_goals")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        setMember((data as FullProfile) ?? null);
        setLoading(false);
      });
  }, [id]);

  const [ascentSort, setAscentSort] = useState("date_desc");
  const [adventureSort, setAdventureSort] = useState("date_asc");
  const theirAscents = useMemo(
    () => sortAscents(ascents.filter((a) => a.user_id === id), ascentSort),
    [ascents, id, ascentSort],
  );
  const theirAdventures = useMemo(
    () => sortAdventures(adventures.filter((a) => a.creator_id === id), adventureSort),
    [adventures, id, adventureSort],
  );
  const theirVisits = useMemo(() => allVisits.filter((v) => v.user_id === id), [allVisits, id]);
  const myAscents = useMemo(() => (user ? ascents.filter((a) => a.user_id === user.id) : []), [ascents, user]);
  const myVisits = useMemo(() => (user ? allVisits.filter((v) => v.user_id === user.id) : []), [allVisits, user]);
  const goals = useMemo(
    () => computeGoals(member?.profile_goals?.length ? member.profile_goals : defaultGoals, theirAscents, theirVisits),
    [member, theirAscents, theirVisits],
  );
  const isMe = user?.id === id;
  const [density, setDensity] = useListDensity("profile-ascents", theirAscents.length);
  const [adventuresDensity, setAdventuresDensity] = useListDensity("profile-adventures", theirAdventures.length);

  const handleDeleteAscent = async (ascentId: string) => {
    const { error } = await supabase.from("ascents").delete().eq("id", ascentId);
    if (error) {
      toast({ title: "Could not delete", description: error.message, variant: "destructive" });
      return;
    }
    reload();
  };

  return (
    <CommunityLayout>
      <Seo
        title={member ? `${member.display_name} — Climber Profile | Ticklelist` : "Climber Profile — Ticklelist"}
        description={
          member
            ? `${member.display_name}'s climbing profile: logged ascents, country high points, badges and planned adventures on Ticklelist.`
            : "A Ticklelist climber profile: logged ascents, country high points, badges and planned adventures."
        }
        noindex
      />


      {loading ? (
        <p className="text-muted-foreground text-sm">Loading profile…</p>
      ) : !member ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <h1 className="font-display tracking-wider text-lg">Climber not found</h1>
          <Button asChild variant="secondary" className="mt-4"><Link to="/community/members">Back to members</Link></Button>
        </div>
      ) : (
        <>
          <header className="rounded-lg border border-border bg-card p-6 flex flex-wrap items-start gap-5">
            <div className="flex flex-col items-center gap-2">
              <ProfileAvatarDisplay path={member.avatar_url} name={member.display_name} className="h-20 w-20" />
              {isMe && (
                <Button asChild variant="secondary" size="sm"><Link to="/community/settings#avatar">Edit avatar</Link></Button>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl tracking-wider">{member.display_name}</h1>
              {member.country && (
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {member.country}
                </p>
              )}
              {member.bio && <p className="text-sm text-muted-foreground mt-3 max-w-xl whitespace-pre-line">{member.bio}</p>}
              <div className="flex flex-wrap gap-5 mt-4 text-sm">
                <span className="flex items-center gap-1"><Mountain className="w-4 h-4 text-primary" /> {theirAscents.length} ascents</span>
                <span className="flex items-center gap-1"><Users className="w-4 h-4 text-primary" /> {followerCounts[member.id] ?? 0} followers</span>
              </div>
            </div>
            <div className="flex gap-2">
              {isMe ? (
                <Button asChild variant="secondary" size="sm"><Link to="/community/settings">Edit profile</Link></Button>
              ) : user ? (
                <FollowButton isFollowing={following.has(member.id)} onToggle={() => toggleFollow(member.id)} />
              ) : null}
            </div>
          </header>

          {goals.length > 0 && (
            <section className="mt-6">
              <GoalBoxes
                goals={goals}
                ascents={theirAscents}
                visits={theirVisits}
                myAscents={myAscents}
                myVisits={myVisits}
                isMe={isMe}
                memberName={member.display_name}
              />
              {isMe && (
                <p className="mt-3 text-xs text-muted-foreground">
                  <Link to="/community/settings#goals" className="text-primary hover:underline">Choose which goals</Link> appear here (up to four).
                </p>
              )}
            </section>
          )}


          {isOwner && <ProfileVisitors visits={visits} profiles={profiles} className="mt-6" hasMore={hasMoreVisits} loadingMore={loadingMoreVisits} onLoadMore={loadMoreVisits} />}

          <BadgesPanel ascents={theirAscents} visits={theirVisits} name={member.display_name} userId={member.id} editable={isMe} className="mt-6" />


          <section className="mt-8 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl tracking-wider">Ascents</h2>
              <div className="flex items-center gap-2">
                {theirAscents.length > 1 && (
                  <SortSelect value={ascentSort} onChange={setAscentSort} options={ascentSortOptions} label="Sort ascents" />
                )}
                {theirAscents.length > 3 && <DensityToggle value={density} onChange={setDensity} />}
              </div>
            </div>
            {theirAscents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No ascents logged yet.</p>
            ) : density !== "large" ? (
              <ul className="grid sm:grid-cols-2 gap-2">
                {theirAscents.map((a) => (
                  <li key={a.id}>
                    <AscentCard
                      density={density}
                      ascent={a}
                      profile={profiles[a.user_id]}
                      currentUserId={user?.id ?? null}
                      onDelete={handleDeleteAscent}
                      cheerCount={cheerCounts[a.id] ?? 0}
                      cheered={myCheers.has(a.id)}
                      onCheer={toggleCheer}
                      profiles={profiles}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              theirAscents.map((a) => (
                <AscentCard key={a.id} ascent={a} profile={profiles[a.user_id]} currentUserId={user?.id ?? null} onDelete={handleDeleteAscent} cheerCount={cheerCounts[a.id] ?? 0} cheered={myCheers.has(a.id)} onCheer={toggleCheer} cheerers={cheerers[a.id]} profiles={profiles} />
              ))
            )}
          </section>

          {theirAdventures.length > 0 && (
            <section className="mt-8 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-xl tracking-wider">Planned adventures</h2>
                {theirAdventures.length > 3 && <DensityToggle value={adventuresDensity} onChange={setAdventuresDensity} />}
              </div>
              {adventuresDensity !== "large" ? (
                <ul className="grid sm:grid-cols-2 gap-2">
                  {theirAdventures.map((a) => (
                    <li key={a.id}>
                      <AdventureCard
                        density={adventuresDensity}
                        adventure={a}
                        signups={signups.filter((s) => s.adventure_id === a.id)}
                        profiles={profiles}
                        currentUserId={user?.id ?? null}
                        onSignUp={async () => {}}
                        onWithdraw={async () => {}}
                        onDelete={async () => {}}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                theirAdventures.map((a) => (
                  <AdventureCard
                    key={a.id}
                    adventure={a}
                    signups={signups.filter((s) => s.adventure_id === a.id)}
                    profiles={profiles}
                    currentUserId={user?.id ?? null}
                    onSignUp={async () => {}}
                    onWithdraw={async () => {}}
                    onDelete={async () => {}}
                  />
                ))
              )}
            </section>
          )}
        </>
      )}
    </CommunityLayout>
  );
};

export default MemberProfilePage;
