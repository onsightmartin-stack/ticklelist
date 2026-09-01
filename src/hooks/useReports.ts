import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export type ReportTarget = "post" | "comment";
export type ReportStatus = "open" | "reviewed" | "dismissed" | "removed";

export const REPORT_REASONS = [
  { value: "spam", label: "Spam or advertising" },
  { value: "harassment", label: "Harassment or hate" },
  { value: "nudity", label: "Nudity or sexual content" },
  { value: "violence", label: "Violence or dangerous content" },
  { value: "misinformation", label: "Misleading information" },
  { value: "other", label: "Something else" },
] as const;

export interface ContentReport {
  id: string;
  reporter_id: string;
  target_type: ReportTarget;
  target_id: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export const reasonLabel = (value: string) =>
  REPORT_REASONS.find((r) => r.value === value)?.label ?? value;

/** Flagging content as a member. */
export const useReporting = () => {
  const { user } = useAuth();

  const report = async (
    targetType: ReportTarget,
    targetId: string,
    reason: string,
    details: string,
  ) => {
    if (!user) {
      toast({ title: "Sign in to report content" });
      return false;
    }
    const { error } = await supabase.from("content_reports").insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason,
      details: details.trim().slice(0, 500) || null,
    });
    if (error) {
      const dupe = error.code === "23505";
      toast({
        title: dupe ? "You already reported this" : "Could not send report",
        description: dupe ? "A moderator is looking into it." : error.message,
        variant: dupe ? undefined : "destructive",
      });
      return dupe;
    }
    toast({ title: "Report sent", description: "Thanks — a moderator will review it." });
    return true;
  };

  return { report, canReport: !!user };
};

interface ReportedContent {
  posts: Record<string, { body: string; user_id: string; media_url: string | null; media_type: string | null }>;
  comments: Record<string, { body: string; user_id: string; post_id: string }>;
}

/** Admin moderation queue. */
export const useModeration = () => {
  const { isAdmin } = useAuth();
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [content, setContent] = useState<ReportedContent>({ posts: {}, comments: {} });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("content_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    const rows = (data as ContentReport[]) ?? [];
    setReports(rows);

    const postIds = rows.filter((r) => r.target_type === "post").map((r) => r.target_id);
    const commentIds = rows.filter((r) => r.target_type === "comment").map((r) => r.target_id);
    const [{ data: p }, { data: c }] = await Promise.all([
      postIds.length
        ? supabase.from("posts").select("id, body, user_id, media_url, media_type").in("id", postIds)
        : Promise.resolve({ data: [] as never[] }),
      commentIds.length
        ? supabase.from("post_comments").select("id, body, user_id, post_id").in("id", commentIds)
        : Promise.resolve({ data: [] as never[] }),
    ]);
    const posts: ReportedContent["posts"] = {};
    (p ?? []).forEach((row: any) => {
      posts[row.id] = { body: row.body, user_id: row.user_id, media_url: row.media_url, media_type: row.media_type };
    });
    const comments: ReportedContent["comments"] = {};
    (c ?? []).forEach((row: any) => {
      comments[row.id] = { body: row.body, user_id: row.user_id, post_id: row.post_id };
    });
    setContent({ posts, comments });
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (report: ContentReport, status: ReportStatus) => {
    const { data: me } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("content_reports")
      .update({ status, reviewed_by: me.user?.id ?? null, reviewed_at: new Date().toISOString() })
      .eq("id", report.id);
    if (error) {
      toast({ title: "Could not update report", description: error.message, variant: "destructive" });
      return;
    }
    await load();
  };

  const removeContent = async (report: ContentReport) => {
    const table = report.target_type === "post" ? "posts" : "post_comments";
    const { error } = await supabase.from(table).delete().eq("id", report.target_id);
    if (error) {
      toast({ title: "Could not remove content", description: error.message, variant: "destructive" });
      return;
    }
    // Close every report pointing at the same piece of content.
    await supabase
      .from("content_reports")
      .update({ status: "removed", reviewed_at: new Date().toISOString() })
      .eq("target_type", report.target_type)
      .eq("target_id", report.target_id);
    toast({ title: "Content removed" });
    await load();
  };

  return { reports, content, loading, isAdmin, setStatus, removeContent, reload: load };
};
