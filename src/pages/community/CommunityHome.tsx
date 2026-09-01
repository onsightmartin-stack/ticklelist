import { useState } from "react";
import Seo from "@/components/Seo";
import { Link } from "@/lib/router-compat";
import { Mountain, Plus, Users, ListChecks, Trophy, Bell, Compass } from "lucide-react";
import CommunityLayout from "@/components/community/CommunityLayout";
import UniversalSearch from "@/components/community/UniversalSearch";
import CommunityStats from "@/components/community/CommunityStats";
import ActivityFeed from "@/components/community/ActivityFeed";
import PostFeed from "@/components/community/PostFeed";
import SummitPhotoForm from "@/components/community/SummitPhotoForm";
import MembersOnly from "@/components/community/MembersOnly";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCommunityData } from "@/hooks/useCommunityData";

const perks = [
  { icon: Mountain, title: "Log your ascents", text: "Country high points and famous peaks, with routes, dates and trip notes." },
  { icon: Users, title: "Find partners", text: "Post an adventure and let other climbers sign up as interested or committed." },
  { icon: ListChecks, title: "Tick challenge lists", text: "Seven Summits, 8000ers, volcanic seven, EU high points and more." },
  { icon: Trophy, title: "Climb the leaderboard", text: "Friendly rankings, badges and ranks based on your logbook." },
  { icon: Bell, title: "Follow and get notified", text: "Follow climbers, like and comment on posts, get alerts in real time." },
];

const CommunityHome = () => {
  const { user, profile } = useAuth();
  const { adventures, signups, ascents, profiles } = useCommunityData();
  const [feedKey, setFeedKey] = useState(0);

  if (!user) {
    return (
      <CommunityLayout>
        <Seo
          title="Your adventure bucketlist and peakbagging community!"
          description="From the highpoint of the Maldives to the top of Everest, Vatican City to the Taj Mahal — document your adventures, log the places you've been, plan trips with friends and compete with XP and levels."
          path="/community"
        />

        <section className="text-center max-w-2xl mx-auto">
          <p className="text-[10px] tracking-[0.3em] uppercase text-primary font-display">Ticklelist — Tick your adventure!</p>
          <h1 className="font-display text-3xl md:text-5xl tracking-wider mt-2">
            Your adventure bucketlist and peakbagging community!
          </h1>
          <p className="mt-4 text-muted-foreground">
            From the highpoint of the Maldives to the top of Everest, Vatican City to the Taj Mahal — document your
            adventures, log the places you've been, plan trips together with friends or compete with XP and levels.
            No adventure is too small or too great to tickle you! 🏔️
          </p>
          <div className="mt-7 max-w-xl mx-auto">
            <UniversalSearch size="lg" />
            <p className="mt-2 text-xs text-muted-foreground">
              Add ascent, a place or find an adventure — sign in to save your ticks.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Button asChild size="lg">
              <Link to="/auth">Join Ticklelist</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        </section>

        <section className="mt-10">
          <CommunityStats ascents={ascents} adventures={adventures} profiles={profiles} />
        </section>

        <section className="mt-8 grid sm:grid-cols-2 gap-3">
          {perks.map((p) => (
            <div key={p.title} className="rounded-lg border border-border bg-card p-4 flex gap-3">
              <p.icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h2 className="font-display tracking-wider text-sm">{p.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{p.text}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-8">
          <MembersOnly
            title="The feed is for members"
            description="Posts, activity, ascents, lists, leaderboards and member profiles unlock as soon as you sign in."
          />
        </section>
      </CommunityLayout>
    );
  }

  return (
    <CommunityLayout>
      <Seo
        title="Your Feed — Ticklelist"
        description="Your Ticklelist feed: member posts, new ascents, planned adventures and community activity."
        noindex
      />

      <section className="mb-8">
        <UniversalSearch size="lg" className="mb-6" />
        <p className="text-[10px] tracking-[0.3em] uppercase text-primary font-display">Signed in — welcome back</p>
        <h1 className="font-display text-3xl md:text-4xl tracking-wider mt-2">
          Welcome back, {profile?.display_name ?? "climber"}
        </h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">
          Here's what the community has been up to. Log your climbs, post the peaks on your wishlist and find partners
          who want to join. 🏔️
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/community/ascents"><Mountain className="w-4 h-4 mr-1" /> Log an ascent</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/community/adventures"><Plus className="w-4 h-4 mr-1" /> Post an adventure</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/community/members"><Users className="w-4 h-4 mr-1" /> Find members</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/community/my-adventures"><Compass className="w-4 h-4 mr-1" /> My adventures</Link>
          </Button>
        </div>
      </section>

      <div className="space-y-6">
        <CommunityStats ascents={ascents} adventures={adventures} profiles={profiles} />

        <section>
          <h2 className="font-display text-xl tracking-wider mb-3">Summit photos</h2>
          <SummitPhotoForm userId={user.id} onPosted={() => setFeedKey((k) => k + 1)} />
        </section>

        <section>
          <h2 className="font-display text-xl tracking-wider mb-3">Posts</h2>
          <PostFeed key={feedKey} profiles={profiles} />
        </section>


        <section>
          <h2 className="font-display text-xl tracking-wider mb-3">Activity</h2>
          <ActivityFeed
            ascents={ascents}
            adventures={adventures}
            signups={signups}
            profiles={profiles}
            currentUserId={user.id}
          />
        </section>
      </div>
    </CommunityLayout>
  );
};

export default CommunityHome;

