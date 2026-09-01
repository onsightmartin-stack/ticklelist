import { useMemo } from "react";
import { Suspense, lazy } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import Seo from "@/components/Seo";
import { Link, useParams } from "@/lib/router-compat";
import CommunityLayout from "@/components/community/CommunityLayout";
import { adventureChallenges } from "@/data/adventure-challenges";
import { useCommunityData } from "@/hooks/useCommunityData";
import { useVisits } from "@/hooks/useVisits";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const ChallengeMap = lazy(() => import("@/components/community/ChallengeMap"));

const MapFallback = () => (
  <div className="h-[420px] w-full animate-pulse rounded-lg border border-border bg-muted/40" />
);

const ChallengeMapPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { ascents } = useCommunityData();
  const { visits } = useVisits();

  const challenge = adventureChallenges.find((c) => c.id === id);

  const tickedKeys = useMemo(() => {
    const s = new Set<string>();
    ascents
      .filter((a) => a.user_id === user?.id)
      .forEach((a) =>
        s.add(
          a.peak_type === "country_highpoint"
            ? `hp:${a.country ?? a.peak_name}`
            : `fp:${a.peak_name}`,
        ),
      );
    visits
      .filter((v) => v.user_id === user?.id)
      .forEach((v) => s.add(v.place_key));
    return s;
  }, [ascents, visits, user]);

  if (!challenge) {
    return (
      <CommunityLayout>
        <Seo title="Challenge not found — Ticklelist" description="The challenge you are looking for could not be found." noindex />
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <h1 className="font-display tracking-wider text-lg">Challenge not found</h1>
          <Button asChild variant="secondary" className="mt-4">
            <Link to="/community/my-adventures">Back to adventures</Link>
          </Button>
        </div>
      </CommunityLayout>
    );
  }

  return (
    <CommunityLayout>
      <Seo
        title={`${challenge.name} — Map | Ticklelist`}
        description={`See where every site in the ${challenge.name} challenge is located on a map.`}
        noindex
      />
      <div className="space-y-4">
        <div>
          <Link
            to="/community/my-adventures"
            className="text-xs text-muted-foreground hover:text-primary"
          >
            ← Back to adventures
          </Link>
          <h1 className="mt-2 font-display text-2xl tracking-wider flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            {challenge.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{challenge.blurb}</p>
        </div>

        <ClientOnly fallback={<MapFallback />}>
          <Suspense fallback={<MapFallback />}>
            <ChallengeMap challenge={challenge} tickedKeys={tickedKeys} />
          </Suspense>
        </ClientOnly>

        <p className="text-xs text-muted-foreground">
          Markers show approximate locations. Cyan = visited, grey = not yet. Tap a marker for
          details.
        </p>
      </div>
    </CommunityLayout>
  );
};

export default ChallengeMapPage;
