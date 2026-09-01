import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { notify, notifyMentions } from "@/lib/notify";
import type { ReactionKey } from "@/lib/reactions";

export interface Post {
  id: string;
  user_id: string;
  body: string;
  peak_name: string | null;
  created_at: string;
  edited_at?: string | null;
  media_url?: string | null;
  media_type?: "image" | "video" | "youtube" | null;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  edited_at?: string | null;
  parent_id?: string | null;
}

export const POST_MAX = 1000;
export const COMMENT_MAX = 500;

/** Posts + reactions + saves + threaded comments for the Ticklelist wall. */
export const usePosts = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [myLikes, setMyLikes] = useState<Set<string>>(new Set());
  /** post id -> reaction key -> count */
  const [reactions, setReactions] = useState<Record<string, Record<string, number>>>({});
  const [myReactions, setMyReactions] = useState<Record<string, ReactionKey>>({});
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: p }, { data: c }, { data: l }, { data: r }, { data: s }] = await Promise.all([
      supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("post_comments").select("*").order("created_at", { ascending: true }),
      supabase.from("post_likes").select("post_id, user_id"),
      supabase.from("post_reactions").select("post_id, user_id, emoji"),
      user
        ? supabase.from("post_saves").select("post_id").eq("user_id", user.id)
        : Promise.resolve({ data: [] as { post_id: string }[] }),
    ]);

    setPosts((p as Post[]) ?? []);
    setComments((c as PostComment[]) ?? []);

    const counts: Record<string, number> = {};
    const mine = new Set<string>();
    ((l as { post_id: string; user_id: string }[]) ?? []).forEach((row) => {
      counts[row.post_id] = (counts[row.post_id] ?? 0) + 1;
      if (user && row.user_id === user.id) mine.add(row.post_id);
    });
    setLikeCounts(counts);
    setMyLikes(mine);

    const byPost: Record<string, Record<string, number>> = {};
    const own: Record<string, ReactionKey> = {};
    ((r as { post_id: string; user_id: string; emoji: string }[]) ?? []).forEach((row) => {
      const bucket = (byPost[row.post_id] ??= {});
      bucket[row.emoji] = (bucket[row.emoji] ?? 0) + 1;
      if (user && row.user_id === user.id) own[row.post_id] = row.emoji as ReactionKey;
    });
    setReactions(byPost);
    setMyReactions(own);

    setSaved(new Set(((s as { post_id: string }[]) ?? []).map((row) => row.post_id)));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const requireUser = () => {
    if (!user) {
      toast({ title: "Sign in to join the conversation" });
      return false;
    }
    return true;
  };

  const createPost = async (
    body: string,
    peakName: string,
    media?: { url: string; type: "image" | "video" | "youtube" } | null,
  ) => {
    if (!requireUser()) return false;
    const text = body.trim();
    if (!text && !media) {
      toast({ title: "Write something or attach media first", variant: "destructive" });
      return false;
    }
    if (text.length > POST_MAX) {
      toast({ title: `Posts are limited to ${POST_MAX} characters`, variant: "destructive" });
      return false;
    }
    const { data: created, error } = await supabase
      .from("posts")
      .insert({
        user_id: user!.id,
        body: text,
        peak_name: peakName.trim().slice(0, 120) || null,
        media_url: media?.url ?? null,
        media_type: media?.type ?? null,
      })
      .select("id")
      .single();
    if (error) {
      toast({ title: "Could not post", description: error.message, variant: "destructive" });
      return false;
    }
    notifyMentions(text, user!.id, "mentioned you in a post", `/community#post-${created?.id ?? ""}`);
    await load();
    return true;
  };

  /** Edit your own post text / peak tag. */
  const updatePost = async (id: string, body: string, peakName?: string | null) => {
    if (!requireUser()) return false;
    const text = body.trim();
    if (text.length > POST_MAX) {
      toast({ title: `Posts are limited to ${POST_MAX} characters`, variant: "destructive" });
      return false;
    }
    const { error } = await supabase
      .from("posts")
      .update({
        body: text,
        ...(peakName === undefined ? {} : { peak_name: peakName?.trim().slice(0, 120) || null }),
        edited_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      toast({ title: "Could not save changes", description: error.message, variant: "destructive" });
      return false;
    }
    await load();
    return true;
  };

  const deletePost = async (id: string) => {
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) {
      toast({ title: "Could not delete", description: error.message, variant: "destructive" });
      return;
    }
    await load();
  };

  const toggleLike = async (postId: string) => {
    if (!requireUser()) return;
    const liked = myLikes.has(postId);

    setMyLikes((prev) => {
      const next = new Set(prev);
      liked ? next.delete(postId) : next.add(postId);
      return next;
    });
    setLikeCounts((prev) => ({ ...prev, [postId]: Math.max(0, (prev[postId] ?? 0) + (liked ? -1 : 1)) }));

    const { error } = liked
      ? await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user!.id)
      : await supabase.from("post_likes").insert({ post_id: postId, user_id: user!.id });

    if (error) {
      toast({ title: "Could not update like", description: error.message, variant: "destructive" });
      load();
    } else if (!liked) {
      const author = posts.find((p) => p.id === postId)?.user_id;
      notify({
        recipientId: author,
        actorId: user!.id,
        kind: "like",
        body: "liked your post",
        link: `/community#post-${postId}`,
      });
    }
  };

  /** Set, change or clear an emoji reaction on a post. */
  const setReaction = async (postId: string, emoji: ReactionKey | null) => {
    if (!requireUser()) return;
    const current = myReactions[postId] ?? null;
    if (current === emoji) return;

    // Optimistic tally update.
    setReactions((prev) => {
      const bucket = { ...(prev[postId] ?? {}) };
      if (current) bucket[current] = Math.max(0, (bucket[current] ?? 1) - 1);
      if (emoji) bucket[emoji] = (bucket[emoji] ?? 0) + 1;
      return { ...prev, [postId]: bucket };
    });
    setMyReactions((prev) => {
      const next = { ...prev };
      if (emoji) next[postId] = emoji;
      else delete next[postId];
      return next;
    });

    const { error } = emoji
      ? await supabase
          .from("post_reactions")
          .upsert({ post_id: postId, user_id: user!.id, emoji }, { onConflict: "post_id,user_id" })
      : await supabase.from("post_reactions").delete().eq("post_id", postId).eq("user_id", user!.id);

    if (error) {
      toast({ title: "Could not react", description: error.message, variant: "destructive" });
      load();
      return;
    }
    if (emoji && !current) {
      const author = posts.find((p) => p.id === postId)?.user_id;
      notify({
        recipientId: author,
        actorId: user!.id,
        kind: "like",
        body: "reacted to your post",
        link: `/community#post-${postId}`,
      });
    }
  };

  /** Private bookmark so members can come back to a post later. */
  const toggleSave = async (postId: string) => {
    if (!requireUser()) return;
    const isSaved = saved.has(postId);
    setSaved((prev) => {
      const next = new Set(prev);
      isSaved ? next.delete(postId) : next.add(postId);
      return next;
    });
    const { error } = isSaved
      ? await supabase.from("post_saves").delete().eq("post_id", postId).eq("user_id", user!.id)
      : await supabase.from("post_saves").insert({ post_id: postId, user_id: user!.id });
    if (error) {
      toast({ title: "Could not update saved posts", description: error.message, variant: "destructive" });
      load();
      return;
    }
    toast({ title: isSaved ? "Removed from saved" : "Saved to your bookmarks" });
  };

  const addComment = async (postId: string, body: string, parentId?: string | null) => {
    if (!requireUser()) return false;
    const text = body.trim();
    if (!text) return false;
    if (text.length > COMMENT_MAX) {
      toast({ title: `Comments are limited to ${COMMENT_MAX} characters`, variant: "destructive" });
      return false;
    }
    const { error } = await supabase
      .from("post_comments")
      .insert({ post_id: postId, user_id: user!.id, body: text, parent_id: parentId ?? null });
    if (error) {
      toast({ title: "Could not comment", description: error.message, variant: "destructive" });
      return false;
    }
    const author = posts.find((p) => p.id === postId)?.user_id;
    const parentAuthor = parentId ? comments.find((c) => c.id === parentId)?.user_id : undefined;
    const link = `/community#post-${postId}`;
    notify({ recipientId: author, actorId: user!.id, kind: "comment", body: "commented on your post", link });
    if (parentAuthor && parentAuthor !== author) {
      notify({ recipientId: parentAuthor, actorId: user!.id, kind: "comment", body: "replied to your comment", link });
    }
    notifyMentions(text, user!.id, "mentioned you in a comment", link, author ? [author] : []);
    await load();
    return true;
  };

  const updateComment = async (id: string, body: string) => {
    if (!requireUser()) return false;
    const text = body.trim();
    if (!text) return false;
    const { error } = await supabase
      .from("post_comments")
      .update({ body: text.slice(0, COMMENT_MAX), edited_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast({ title: "Could not save comment", description: error.message, variant: "destructive" });
      return false;
    }
    await load();
    return true;
  };

  const deleteComment = async (id: string) => {
    const { error } = await supabase.from("post_comments").delete().eq("id", id);
    if (error) {
      toast({ title: "Could not delete comment", description: error.message, variant: "destructive" });
      return;
    }
    await load();
  };

  /** Total engagement per post — used for the "Top" sort. */
  const engagement = useMemo(() => {
    const map: Record<string, number> = {};
    posts.forEach((p) => {
      const react = Object.values(reactions[p.id] ?? {}).reduce((a, b) => a + b, 0);
      map[p.id] = (likeCounts[p.id] ?? 0) + react + comments.filter((c) => c.post_id === p.id).length;
    });
    return map;
  }, [posts, reactions, likeCounts, comments]);

  return {
    posts,
    comments,
    likeCounts,
    myLikes,
    reactions,
    myReactions,
    saved,
    engagement,
    loading,
    createPost,
    updatePost,
    deletePost,
    toggleLike,
    setReaction,
    toggleSave,
    addComment,
    updateComment,
    deleteComment,
    reload: load,
  };
};
