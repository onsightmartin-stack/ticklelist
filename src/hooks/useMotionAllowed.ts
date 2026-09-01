import { useEffect, useState } from "react";
import { MOTION_CHANGE_EVENT, motionAllowed } from "@/lib/motion";

/**
 * Reactive version of motionAllowed(): re-renders when the user changes the
 * motion preference in Appearance settings, in another tab, or at OS level.
 * Returns true on the server so SSR markup matches the "animations on" default.
 */
export function useMotionAllowed(): boolean {
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    const sync = () => setAllowed(motionAllowed());
    sync();

    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    mq?.addEventListener?.("change", sync);
    window.addEventListener(MOTION_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      mq?.removeEventListener?.("change", sync);
      window.removeEventListener(MOTION_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return allowed;
}
