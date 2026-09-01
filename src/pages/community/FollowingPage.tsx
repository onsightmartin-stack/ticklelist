import { useMemo, useState } from "react";
import Seo from "@/components/Seo";
import { Link } from "@/lib/router-compat";
import { Users } from "lucide-react";
import CommunityLayout from "@/components/community/CommunityLayout";
import MembersOnly from "@/components/community/MembersOnly";
import MemberAvatar from "@/components/community/MemberAvatar";
import FollowButton from "@/components/community/FollowButton";
import ActivityFeed from "@/components/community/ActivityFeed";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCommunityData } from "@/hooks/useCommunityData";
import { useFollows } from "@/hooks/useFollows";
import type { PublicProfile } from "@/lib/community";

type Tab = "feed" | "following" | "followers";

const FollowingPage = () => {
  const { user } = useAuth();
  const { profiles, ascents, adventures, signups, fetching } = useCommunityData();
  const { following, followers, followerCounts, toggleFollow } = useFollows();
  const [tab, setTab] = useState<Tab>("feed");

  const list = (ids: Set<string>): (PublicProfile & { ascentCount: number })[] => {
    const counts: Record<string, number> = {};
    ascents.forEach((a) => { counts[a.user_id] = (counts[a.user_id] ?? 0) + 1; });
    return [...ids]
      .map((id) => profiles[id])
      .filter((p): p is PublicProfile => Boolean(p))
      .map((p) => ({ ...p, ascentCount: counts[p.id] ?? 0 }))
      .sort((a, b) => b.ascentCount - a.ascentCount || (a.display_name ?? "").localeCompare(b.display_name ?? ""));
  };

  const followingList = useMemo(() => list(following), [following, profiles, ascents]);
  const followerList = useMemo(() => list(followers), [followers, profiles, ascents]);

  const followingAscents = useMemo(
    () => ascents.filter((a) => following.has(a.user_id) || a.user_id === user?.id),
    [ascents, following, user],
  );
  const followingAdventures = useMemo(
    () => adventures.filter((a) => following.has(a.creator_id) || a.creator_id === user?.id),
    [adventures, following, user],
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: "feed", label: "Following feed" },
    { id: "following", label: `Following · ${following.size}` },
    { id: "followers", label: `Followers · ${followers.size}` },
  ];

  const renderPeople = (people: (PublicProfile & { ascentCount: number })[], empty: string) =>
    people.length === 0 ? (
      <p className="text-sm text-muted-foreground py-6">{empty}</p>
    ) : (
      <ul className="grid sm:grid-cols-2 gap-3">
        {people.map((m) => (
          <li key={m.id} className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
            <Link to={`/community/members/${m.id}`} className="flex items-center gap-3 min-w-0 flex-1">
              <MemberAvatar path={m.avatar_url} name={m.display_name} className="h-10 w-10" />
              <div className="min-w-0">
                <p className="font-display tracking-wider truncate">{m.display_name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {m.ascentCount} ascent{m.ascentCount === 1 ? "" : "s"}
                  {m.country ? ` · ${m.country}` : ""}
                </p>
              </div>
            </Link>
            {user && user.id !== m.id && (
              <FollowButton
                isFollowing={following.has(m.id)}
                followerCount={followerCounts[m.id]}
                onToggle={() => toggleFollow(m.id)}
              />
            )}
          </li>
        ))}
      </ul>
    );

  if (!user) {
    return (
      <CommunityLayout>
      <Seo
        title="Following — Ticklelist"
        description="Ascents and adventures from the climbers you follow, plus your followers list."
        noindex
      />
        <MembersOnly title="Following is members only" description="Sign in to follow climbers and get a feed of just their ascents and adventures." />
      </CommunityLayout>
    );
  }

  return (
    <CommunityLayout>
      <Seo
        title="Following — Ticklelist"
        description="Ascents and adventures from the climbers you follow, plus your followers list."
        noindex
      />

      <h1 className="font-display text-2xl tracking-wider mb-2">Following</h1>
      <p className="text-sm text-muted-foreground mb-5">
        Updates from the climbers you follow, and the people following you.
      </p>

      {!user ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <Users className="w-6 h-6 mx-auto text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Sign in to follow climbers and build your feed.</p>
          <Button asChild className="mt-4"><Link to="/auth">Sign in</Link></Button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-1 rounded-md border border-border p-0.5 w-fit mb-5">
            {tabs.map((t) => (
              <Button
                key={t.id}
                type="button"
                size="sm"
                variant={tab === t.id ? "secondary" : "ghost"}
                className="h-7 text-[11px] tracking-wide"
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </Button>
            ))}
          </div>

          {fetching ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : tab === "feed" ? (
            following.size === 0 ? (
              <p className="text-sm text-muted-foreground py-6">
                You're not following anyone yet —{" "}
                <Link to="/community/members" className="text-primary underline">find members</Link> to follow.
              </p>
            ) : (
              <ActivityFeed
                ascents={followingAscents}
                adventures={followingAdventures}
                signups={signups}
                profiles={profiles}
                currentUserId={user.id}
              />
            )
          ) : tab === "following" ? (
            renderPeople(followingList, "You're not following anyone yet.")
          ) : (
            renderPeople(followerList, "No one is following you yet.")
          )}
        </>
      )}
    </CommunityLayout>
  );
};

export default FollowingPage;
