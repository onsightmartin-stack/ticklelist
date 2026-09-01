import { Link } from "@/lib/router-compat";
import { ShieldCheck } from "lucide-react";
import Seo from "@/components/Seo";
import CommunityLayout from "@/components/community/CommunityLayout";
import MembersOnly from "@/components/community/MembersOnly";
import PostFeed from "@/components/community/PostFeed";
import { useAuth } from "@/hooks/useAuth";
import { useCommunityData } from "@/hooks/useCommunityData";

/** The Wall — member posts with pictures, videos and comments. */
const WallPage = () => {
  const { user, isAdmin } = useAuth();
  const { profiles } = useCommunityData();

  return (
    <CommunityLayout>
      <Seo
        title="The Wall — Ticklelist"
        description="Share photos, videos and stories from the mountains with the Ticklelist community, and comment on other members' posts."
        path="/community/wall"
        noindex={!!user}
      />

      <header className="mb-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-primary font-display">Ticklelist</p>
        <h1 className="font-display text-3xl md:text-4xl tracking-wider mt-2">The Wall</h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">
          Post anything — a summit photo, a video, a trip report or a question. Everyone in the community can like and
          comment. 🏔️
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          See something wrong? Use the flag icon on a post or comment to report it.
        </p>
        {isAdmin && (
          <Link
            to="/community/moderation"
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary underline"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Moderation queue
          </Link>
        )}
      </header>

      {user ? (
        <PostFeed profiles={profiles} />
      ) : (
        <MembersOnly
          title="The Wall is for members"
          description="Sign in to post photos, videos and stories, and to comment on other climbers' posts."
        />
      )}
    </CommunityLayout>
  );
};

export default WallPage;
