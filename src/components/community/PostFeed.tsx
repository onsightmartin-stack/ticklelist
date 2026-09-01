import { fuzzyMatch } from "@/lib/fuzzy";
import PeakSelector from "@/components/community/PeakSelector";
import WallControls, { type WallSort } from "@/components/community/WallControls";
import { useMemo, useRef, useState } from "react";

import { Link } from "@/lib/router-compat";
import { ImagePlus, Send, Trophy, Video, X, Youtube } from "lucide-react";
import LinkPreviewCard from "@/components/community/LinkPreviewCard";
import PostCard from "@/components/community/PostCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePosts, POST_MAX } from "@/hooks/usePosts";
import { usePhotoContest } from "@/hooks/usePhotoContest";
import type { PublicProfile } from "@/lib/community";
import { findPreview } from "@/lib/link-preview";
import { peakCountry } from "@/lib/peak-link";
import { slugify } from "@/lib/slug";
import { uploadWallMedia, youtubeId, type MediaType } from "@/lib/wall-media";
import { celebrate } from "@/components/Celebration";


interface Props {
  profiles: Record<string, PublicProfile>;
}

/** Member-written posts with pictures, videos, likes and comments. */
const PostFeed = ({ profiles }: Props) => {
  const { user, isAdmin } = useAuth();
  const {
    posts, comments, likeCounts, myLikes, reactions, myReactions, saved, engagement, loading,
    createPost, updatePost, deletePost, toggleLike, setReaction, toggleSave,
    addComment, updateComment, deleteComment,
  } = usePosts();
  const [body, setBody] = useState("");
  const [peak, setPeak] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [media, setMedia] = useState<{ url: string; type: MediaType } | null>(null);
  const [tube, setTube] = useState("");
  const [showTube, setShowTube] = useState(false);
  const [enterContest, setEnterContest] = useState(false);
  const { submitEntry } = usePhotoContest();
  const fileRef = useRef<HTMLInputElement>(null);
  const draftPreview = media ? null : findPreview(body);


  // Sort / filter / pagination
  const [savedOnly, setSavedOnly] = useState(false);
  const [sort, setSort] = useState<WallSort>("newest");
  const [query, setQuery] = useState("");
  const [peakFilter, setPeakFilter] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const peakOptions = useMemo(() => {
    const counts = new Map<string, number>();
    posts.forEach((p) => {
      if (p.peak_name) counts.set(p.peak_name, (counts.get(p.peak_name) ?? 0) + 1);
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 12)
      .map(([name]) => name);
  }, [posts]);

  const filtered = useMemo(() => {
    const q = query.trim();
    const list = posts.filter((p) => {
      if (peakFilter && p.peak_name !== peakFilter) return false;
      if (savedOnly && !saved.has(p.id)) return false;
      if (!q) return true;
      return fuzzyMatch(q, p.body, p.peak_name, profiles[p.user_id]?.display_name);
    });
    return [...list].sort((a, b) => {
      if (sort === "top") {
        const diff = (engagement[b.id] ?? 0) - (engagement[a.id] ?? 0);
        if (diff !== 0) return diff;
        return b.created_at.localeCompare(a.created_at);
      }
      return sort === "oldest"
        ? a.created_at.localeCompare(b.created_at)
        : b.created_at.localeCompare(a.created_at);
    });
  }, [posts, query, peakFilter, sort, engagement, profiles, savedOnly, saved]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);


  const pickFile = async (file: File | undefined) => {
    if (!file || !user) return;
    setUploading(true);
    const res = await uploadWallMedia(file, user.id);
    setUploading(false);
    if ("error" in res) {
      toast({ title: "Upload failed", description: res.error, variant: "destructive" });
      return;
    }
    setMedia(res);
    setShowTube(false);
  };

  const attachTube = () => {
    const id = youtubeId(tube.trim());
    if (!id) {
      toast({ title: "That does not look like a YouTube link", variant: "destructive" });
      return;
    }
    setMedia({ url: id, type: "youtube" });
    setTube("");
    setShowTube(false);
  };

  const canEnterContest = !!media && media.type === "image";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const photoUrl = media?.type === "image" ? media.url : null;
    const ok = await createPost(body, peak, media);
    if (ok && enterContest && photoUrl) {
      const resolvedCountry = peakCountry(peak);
      const peakName = peak.includes("·") ? (peak.split("·")[0] ?? "").trim() : peak.trim();
      if (resolvedCountry && peakName) {
        const entered = await submitEntry({
          countrySlug: slugify(resolvedCountry),
          country: resolvedCountry,
          peakName,
          photoUrl,
          caption: body.trim(),
        });
        if (entered) {
          toast({ title: "Entered the photo contest 🏆", description: "Members can now vote for your shot." });
        }
      } else {
        toast({
          title: "Could not enter the contest",
          description: "Pick a recognized country high point to enter the contest.",
          variant: "destructive",
        });
      }
    }
    setBusy(false);
    if (ok) {
      celebrate();
      setBody("");
      setPeak("");
      setMedia(null);
      setEnterContest(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };


  return (
    <div className="space-y-4">
      {user ? (
        <form onSubmit={submit} className="rounded-lg border border-border bg-card p-4 space-y-3">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={POST_MAX}
            rows={3}
            placeholder="Share a climb, a photo, a video, a question or a plan…"
            aria-label="Post text"
          />

          {draftPreview && (
            <div>
              <p className="text-[11px] text-muted-foreground">Preview</p>
              <LinkPreviewCard preview={draftPreview} className="mt-1" />
            </div>
          )}

          {media && (
            <div className="relative overflow-hidden rounded-md border border-border">
              {media.type === "image" && <img src={media.url} alt="Attachment preview" className="w-full max-h-72 object-cover" />}
              {media.type === "video" && <video src={media.url} controls playsInline className="w-full max-h-72" />}
              {media.type === "youtube" && (
                <div className="aspect-video w-full">
                  <iframe
                    src={`https://www.youtube.com/embed/${media.url}`}
                    title="YouTube preview"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setMedia(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                aria-label="Remove attachment"
                className="absolute top-2 right-2 rounded-full bg-background/80 p-1 text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {showTube && (
            <div className="flex gap-2">
              <Input
                value={tube}
                onChange={(e) => setTube(e.target.value)}
                placeholder="Paste a YouTube link"
                aria-label="YouTube link"
              />
              <Button type="button" size="sm" variant="secondary" onClick={attachTube}>Attach</Button>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus className="w-3.5 h-3.5 mr-1" /> {uploading ? "Uploading…" : "Photo / video"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowTube((v) => !v)}>
              <Youtube className="w-3.5 h-3.5 mr-1" /> YouTube
            </Button>
            <PeakSelector value={peak} onChange={setPeak} className="sm:w-64" />

            {canEnterContest && (
              <label
                htmlFor="wall-contest"
                className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-xs cursor-pointer hover:border-primary/50 transition-colors"
                title="The winning photo becomes the peak page's hero image"
              >
                <input
                  id="wall-contest"
                  type="checkbox"
                  checked={enterContest}
                  onChange={(e) => setEnterContest(e.target.checked)}
                  className="h-3.5 w-3.5 accent-primary"
                />
                <Trophy className="w-3.5 h-3.5 text-primary" />
                Enter photo contest
              </label>
            )}



            <span className="text-[11px] text-muted-foreground ml-auto">{body.length}/{POST_MAX}</span>
            <Button type="submit" size="sm" disabled={busy || uploading || (!body.trim() && !media)}>
              <Send className="w-3.5 h-3.5 mr-1" /> Post
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link to="/auth" className="text-primary underline">Sign in</Link> to post, like and comment.
        </p>
      )}

      {!loading && posts.length > 0 && (
        <WallControls
          sort={sort}
          onSort={(s) => { setSort(s); setPage(1); }}
          query={query}
          onQuery={(q) => { setQuery(q); setPage(1); }}
          peak={peakFilter}
          onPeak={(p) => { setPeakFilter(p); setPage(1); }}
          peaks={peakOptions}
          total={filtered.length}
          shown={visible.length}
          savedOnly={savedOnly}
          {...(user ? { onSavedOnly: (v: boolean) => { setSavedOnly(v); setPage(1); } } : {})}
          savedCount={saved.size}
        />

      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading posts…</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Video className="w-4 h-4" /> Nothing on the wall yet — be the first to post.
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No posts match those filters.</p>
      ) : (
        <>
          {visible.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              comments={comments.filter((c) => c.post_id === p.id)}
              profiles={profiles}
              likeCount={likeCounts[p.id] ?? 0}
              liked={myLikes.has(p.id)}
              reactionCounts={reactions[p.id] ?? {}}
              myReaction={myReactions[p.id] ?? null}
              isSaved={saved.has(p.id)}
              currentUserId={user?.id ?? null}
              isAdmin={isAdmin}
              onToggleLike={() => toggleLike(p.id)}
              onReact={(key) => setReaction(p.id, key)}
              onToggleSave={() => toggleSave(p.id)}
              onComment={(text, parentId) => addComment(p.id, text, parentId)}
              onEditComment={updateComment}
              onEdit={(body, peakName) => updatePost(p.id, body, peakName)}
              onDelete={() => deletePost(p.id)}
              onDeleteComment={deleteComment}
              onTag={(tag) => { setQuery(`#${tag}`); setPage(1); }}
            />

          ))}

          {pageCount > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {safePage} of {pageCount}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={safePage >= pageCount}
                onClick={() => setPage(safePage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default PostFeed;
