import { supabase } from "@/integrations/supabase/client";

export type NotificationKind = "follow" | "like" | "comment" | "mention" | "cheer" | "bug";

export interface AppNotification {
  id: string;
  recipient_id: string;
  actor_id: string;
  kind: NotificationKind;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

interface NotifyInput {
  recipientId: string | null | undefined;
  actorId: string | null | undefined;
  kind: NotificationKind;
  body: string;
  link?: string | null;
}

/**
 * Fire-and-forget notification. Routed through the server-side
 * `send_notification` routine, which verifies a real interaction took place
 * and honours the recipient's preferences. Never blocks or breaks the caller.
 */
export const notify = async ({ recipientId, actorId, kind, body, link }: NotifyInput) => {
  if (!recipientId || !actorId || recipientId === actorId) return;
  try {
    await supabase.rpc("send_notification", {
      _recipient_id: recipientId,
      _kind: kind,
      _body: body.slice(0, 280),
      ...(link ? { _link: link } : {}),
    });

  } catch {
    /* notifications are best-effort */
  }
};


const MENTION_RE = /@([a-zA-Z0-9_.-]{2,40})/g;

const normalise = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Finds @handles in a text and resolves them to member ids by matching
 * either the username or the display name (ignoring case and spacing).
 */
export const resolveMentions = async (text: string): Promise<string[]> => {
  const handles = Array.from(text.matchAll(MENTION_RE)).map((m) => normalise(m[1] ?? ""));
  if (handles.length === 0) return [];

  const { data } = await supabase.from("profiles").select("id, display_name, username");
  const ids = new Set<string>();
  for (const p of data ?? []) {
    const candidates = [p.username ?? "", p.display_name ?? ""].map(normalise).filter(Boolean);
    if (handles.some((h) => candidates.includes(h))) ids.add(p.id);
  }
  return Array.from(ids);
};

/** Notifies every member mentioned in a piece of text. */
export const notifyMentions = async (
  text: string,
  actorId: string,
  body: string,
  link: string,
  skip: string[] = [],
) => {
  const ids = await resolveMentions(text);
  await Promise.all(
    ids
      .filter((id) => !skip.includes(id))
      .map((id) => notify({ recipientId: id, actorId, kind: "mention", body, link })),
  );
};
