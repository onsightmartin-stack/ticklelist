import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { applyTheme, getStoredTheme, isThemeId, setTheme } from "@/lib/themes";

/**
 * Keeps the site theme tied to the signed-in account, not just the device.
 * localStorage is per-origin, so a theme picked on ticklelist.org never reached
 * onsightmartin.com (and never followed the member to another device/browser).
 * On sign-in we pull the saved profile theme; if the profile has none yet we
 * push the current device theme up so it becomes the account default.
 */
const ThemeSync = () => {
  const { user } = useAuth();
  const syncedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;
    // Only pull once per account. Token refreshes / tab focus produce a new
    // user object; re-pulling then would overwrite a theme just picked here.
    if (syncedFor.current === user.id) return;
    syncedFor.current = user.id;
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("theme")
        .eq("id", user.id)
        .maybeSingle<{ theme: string | null }>();
      if (cancelled) return;

      const remote = data?.theme;
      if (isThemeId(remote)) {
        applyTheme(remote);
        try {
          window.localStorage.setItem("onsight-theme", remote);
        } catch {
          /* storage unavailable */
        }
        return;
      }

      const local = getStoredTheme();
      setTheme(local);
      await supabase.from("profiles").update({ theme: local }).eq("id", user.id);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return null;
};

export default ThemeSync;
