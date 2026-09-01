import Seo from "@/components/Seo";
import CommunityLayout from "@/components/community/CommunityLayout";
import MembersOnly from "@/components/community/MembersOnly";
import Leaderboard from "@/components/community/Leaderboard";
import { Link } from "@/lib/router-compat";
import { useAuth } from "@/hooks/useAuth";
import { useCommunityData } from "@/hooks/useCommunityData";

const LeaderboardPage = () => {
  const { user } = useAuth();
  const { ascents, visits, profiles } = useCommunityData();

  if (!user) {
    return (
      <CommunityLayout>
      <Seo
        title="Climber Leaderboard — Ticklelist"
        description="See which Ticklelist climbers have logged the most country high points and famous peaks, with ranks and badges."
        noindex
      />
        <MembersOnly title="Leaderboard is members only" description="Sign in to see how climbers rank across country high points and famous peaks." />
      </CommunityLayout>
    );
  }

  return (
    <CommunityLayout>
      <Seo
        title="Climber Leaderboard — Ticklelist"
        description="See which Ticklelist climbers have logged the most country high points and famous peaks, with ranks and badges."
        noindex
      />
      <h1 className="font-display text-2xl tracking-wider mb-2">Leaderboard</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Want a ranking for one specific list — UN high points, mainland high points, countries visited?{" "}
        <Link to="/community/frontrunners" className="text-primary hover:underline">See the front runners</Link>.
      </p>
      <Leaderboard ascents={ascents} visits={visits} profiles={profiles} currentUserId={user?.id ?? null} />
    </CommunityLayout>
  );
};

export default LeaderboardPage;
