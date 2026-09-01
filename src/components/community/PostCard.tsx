import { useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import {
  Bookmark,
  Check,
  Heart,
  MessageCircle,
  Mountain,
  Pencil,
  Share2,
  Trash2,
  X,
} from "lucide-react";

import CrossSiteLink from "@/components/CrossSiteLink";
import LinkPreviewCard from "@/components/community/LinkPreviewCard";
import MemberAvatar from "@/components/community/MemberAvatar";
import ReactionBar from "@/components/community/ReactionBar";
import ReportButton from "@/components/community/ReportButton";
import RichText from "@/components/community/RichText";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { COMMENT_MAX, POST_MAX, type Post, type PostComment } from "@/hooks/usePosts";
import type { PublicProfile } from "@/lib/community";
import { findPreview } from "@/lib/link-preview";
import { peakPageHref } from "@/lib/peak-link";
import type { ReactionKey } from "@/lib/reactions";
import { timeAgo } from "@/lib/time-ago";
import { cn } from "@/lib/utils";

interface Props {
  post: Post;
  comments: PostComment[];
  profiles: Record<string, PublicProfile>;
  likeCount: number;
  liked: boolean;
  reactionCounts: Record<string, number>;
  myReaction: ReactionKey | null;
  isSaved: boolean;
  currentUserId: string | null;
  isAdmin?: boolean;
  onToggleLike: () => void;
  onReact: (key: ReactionKey | null) => void;
  onToggleSave: () => void;
  onComment: (body: string, parentId?: string | null) => Promise<boolean>;
  onEditComment: (id: string, body: string) => Promise<boolean>;
  onEdit: (body: string, peakName: string | null) => Promise<boolean>;
  onDelete: () => void;
  onDeleteComment: (id: string) => void;
  onTag?: (tag: string) => void;
}

const PostCard = ({
  post,
  comments,
  profiles,
  likeCount,
  liked,
  reactionCounts,
  myReaction,
  isSaved,
  currentUserId,
  isAdmin = false,
  onToggleLike,
  onReact,
  onToggleSave,
  onComment,
  onEditComment,
  onEdit,
  onDelete,
  onDeleteComment,
  onTag,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(post.body ?? "");
  const [editPeak, setEditPeak] = useState(post.peak_name ?? "");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");

  const author = profiles[post.user_id];
  const mine = currentUserId === post.user_id;
  const canDelete = mine || isAdmin;
  const preview = post.media_url ? null : findPreview(post.body ?? "");

  const roots = useMemo(() => comments.filter((c) => !c.parent_id), [comments]);
  const repliesOf = (id: string) => comments.filter((c) => c.parent_id === id);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const ok = await onComment(draft);
    setBusy(false);
    if (ok) setDraft("");
  };

  const sendReply = async (parentId: string) => {
    setBusy(true);
    const ok = await onComment(replyDraft, parentId);
    setBusy(false);
    if (ok) {
      setReplyDraft("");
      setReplyTo(null);
    }
  };

  const saveEdit = async () => {
    setBusy(true);
    const ok = await onEdit(editBody, editPeak.trim() || null);
    setBusy(false);
    if (ok) setEditing(false);
  };

  const share = async () => {
    const url = `${window.location.origin}/community/wall#post-${post.id}`;
    const data = {
      title: "Ticklelist",
      text: post.body?.slice(0, 120) || "A post on Ticklelist",
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied" });
    } catch {
      /* the member dismissed the share sheet */
    }
  };

  const CommentRow = ({ c, depth = 0 }: { c: PostComment; depth?: number }) => {
    const cAuthor = profiles[c.user_id];
    const canEditComment = currentUserId === c.user_id;
    return (
      <div className={cn("space-y-2", depth > 0 && "ml-7 border-l border-border pl-3")}>
        <div className="flex items-start gap-2">
          <MemberAvatar path={cAuthor?.avatar_url ?? null} name={cAuthor?.display_name ?? "Climber"} className="h-6 w-6" />
          <div className="min-w-0 flex-1">
            <p className="text-xs">
              <Link to={`/community/members/${c.user_id}`} className="font-display tracking-wider hover:text-primary">
                {cAuthor?.display_name ?? "Climber"}
              </Link>
              <span className="text-muted-foreground"> · {timeAgo(c.created_at)}</span>
              {c.edited_at && <span className="text-muted-foreground"> · edited</span>}
            </p>

            {editingComment === c.id ? (
              <div className="mt-1 flex gap-2">
                <Input
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  maxLength={COMMENT_MAX}
                  aria-label="Edit comment"
                />
                <Button
                  size="sm"
                  onClick={async () => {
                    const ok = await onEditComment(c.id, commentDraft);
                    if (ok) setEditingComment(null);
                  }}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingComment(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <RichText text={c.body} onTag={onTag} className="text-sm break-words whitespace-pre-line" />
            )}

            {currentUserId && editingComment !== c.id && (
              <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                <button type="button" onClick={() => { setReplyTo(replyTo === c.id ? null : c.id); setReplyDraft(""); }}>
                  Reply
                </button>
                {canEditComment && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingComment(c.id);
                      setCommentDraft(c.body);
                    }}
                  >
                    Edit
                  </button>
                )}
              </div>
            )}

            {replyTo === c.id && (
              <div className="mt-2 flex gap-2">
                <Input
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  maxLength={COMMENT_MAX}
                  placeholder={`Reply to ${cAuthor?.display_name ?? "Climber"}…`}
                  aria-label="Write a reply"
                />
                <Button size="sm" disabled={busy || !replyDraft.trim()} onClick={() => sendReply(c.id)}>
                  Reply
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {currentUserId && currentUserId !== c.user_id && (
              <ReportButton targetType="comment" targetId={c.id} size="xs" />
            )}
            {(currentUserId === c.user_id || isAdmin) && (
              <button
                onClick={() => onDeleteComment(c.id)}
                aria-label="Delete comment"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {repliesOf(c.id).map((r) => (
          <CommentRow key={r.id} c={r} depth={depth + 1} />
        ))}
      </div>
    );
  };

  return (
    <article id={`post-${post.id}`} className="rounded-lg border border-border bg-card p-4 scroll-mt-24">
      <header className="flex items-start gap-3">
        <Link to={`/community/members/${post.user_id}`}>
          <MemberAvatar path={author?.avatar_url ?? null} name={author?.display_name ?? "Climber"} className="h-9 w-9" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link to={`/community/members/${post.user_id}`} className="font-display tracking-wider text-sm hover:text-primary">
            {author?.display_name ?? "Climber"}
          </Link>
          <p className="text-xs text-muted-foreground">
            <time dateTime={post.created_at} title={new Date(post.created_at).toLocaleString()}>
              {timeAgo(post.created_at)}
            </time>
            {post.edited_at && <span> · edited</span>}
            {post.peak_name ? (
              peakPageHref(post.peak_name) ? (
                <CrossSiteLink
                  href={peakPageHref(post.peak_name)!}
                  className="inline-flex items-center gap-1 ml-2 hover:text-primary"
                  title={`Open ${post.peak_name} page`}
                >
                  <Mountain className="w-3 h-3 text-primary" /> {post.peak_name}
                </CrossSiteLink>
              ) : (
                <span className="inline-flex items-center gap-1 ml-2">
                  <Mountain className="w-3 h-3 text-primary" /> {post.peak_name}
                </span>
              )
            ) : null}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {currentUserId && currentUserId !== post.user_id && (
            <ReportButton targetType="post" targetId={post.id} />
          )}
          {mine && !editing && (
            <button
              onClick={() => {
                setEditing(true);
                setEditBody(post.body ?? "");
                setEditPeak(post.peak_name ?? "");
              }}
              aria-label="Edit post"
              className="text-muted-foreground hover:text-primary"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {canDelete && (
            <button onClick={onDelete} aria-label="Delete post" className="text-muted-foreground hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {editing ? (
        <div className="mt-3 space-y-2">
          <Textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            maxLength={POST_MAX}
            rows={3}
            aria-label="Edit post text"
          />
          <Input
            value={editPeak}
            onChange={(e) => setEditPeak(e.target.value)}
            placeholder="Peak / country (optional)"
            aria-label="Edit peak tag"
          />
          <div className="flex gap-2">
            <Button size="sm" disabled={busy} onClick={saveEdit}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        post.body && (
          <RichText text={post.body} onTag={onTag} className="mt-3 text-sm whitespace-pre-line break-words" />
        )
      )}

      {preview && <LinkPreviewCard preview={preview} />}

      {post.media_url && post.media_type === "image" && (
        <img
          src={post.media_url}
          alt={post.peak_name ? `Photo of ${post.peak_name}` : "Member photo"}
          loading="lazy"
          className="mt-3 w-full rounded-md border border-border object-cover max-h-[520px]"
        />
      )}
      {post.media_url && post.media_type === "video" && (
        <video src={post.media_url} controls playsInline className="mt-3 w-full rounded-md border border-border max-h-[520px]" />
      )}
      {post.media_url && post.media_type === "youtube" && (
        <div className="mt-3 aspect-video w-full overflow-hidden rounded-md border border-border">
          <iframe
            src={`https://www.youtube.com/embed/${post.media_url}`}
            title="YouTube video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className="h-full w-full"
          />
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ReactionBar counts={reactionCounts} mine={myReaction} onReact={onReact} disabled={!currentUserId} />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={cn("h-7 gap-1.5 text-[11px]", liked && "text-primary")}
          onClick={onToggleLike}
          aria-label={liked ? "Unlike post" : "Like post"}
        >
          <Heart className={cn("w-3.5 h-3.5", liked && "fill-current")} /> {likeCount}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 text-[11px]"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <MessageCircle className="w-3.5 h-3.5" /> {comments.length}
        </Button>
        <Button type="button" size="sm" variant="ghost" className="h-7 gap-1.5 text-[11px]" onClick={share}>
          <Share2 className="w-3.5 h-3.5" /> Share
        </Button>
        {currentUserId && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={cn("h-7 gap-1.5 text-[11px] ml-auto", isSaved && "text-primary")}
            onClick={onToggleSave}
            aria-label={isSaved ? "Remove from saved" : "Save post"}
          >
            <Bookmark className={cn("w-3.5 h-3.5", isSaved && "fill-current")} /> {isSaved ? "Saved" : "Save"}
          </Button>
        )}
      </div>

      {open && (
        <div className="mt-3 border-t border-border pt-3 space-y-3">
          {roots.length === 0 && <p className="text-xs text-muted-foreground">No comments yet.</p>}
          {roots.map((c) => (
            <CommentRow key={c.id} c={c} />
          ))}

          {currentUserId ? (
            <form onSubmit={submit} className="flex gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={COMMENT_MAX}
                placeholder="Add a comment…  @mention or #tag"
                aria-label="Add a comment"
              />
              <Button type="submit" size="sm" disabled={busy || !draft.trim()}>Send</Button>
            </form>
          ) : (
            <p className="text-xs text-muted-foreground">
              <Link to="/auth" className="text-primary underline">Sign in</Link> to comment.
            </p>
          )}
        </div>
      )}
    </article>
  );
};

export default PostCard;
