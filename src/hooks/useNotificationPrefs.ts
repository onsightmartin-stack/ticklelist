import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { NotificationKind } from "@/lib/notify";

/** "bug" notifications are admin-only and always delivered, so they have no preference. */
export type NotificationPrefs = Record<Exclude<NotificationKind, "bug">, boolean>;

export const defaultPrefs: NotificationPrefs = {
  follow: true,
  like: true,
  comment: true,
  mention: true,
  cheer: true,
};

/** Loads and saves the signed-in member's notification preferences. */
export const useNotificationPrefs = () => {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultPrefs);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user) {
      setPrefs(defaultPrefs);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("notification_prefs")
      .select("follow, like, comment, mention, cheer")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        if (data) setPrefs({ ...defaultPrefs, ...(data as Partial<NotificationPrefs>) });
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const setPref = useCallback(
    async (kind: NotificationKind, value: boolean) => {
      if (!user) return;
      const next = { ...prefs, [kind]: value };
      setPrefs(next);
      setSaving(true);
      await supabase.from("notification_prefs").upsert({ user_id: user.id, ...next }, { onConflict: "user_id" });
      setSaving(false);
    },
    [prefs, user],
  );

  return { prefs, setPref, loading, saving };
};
