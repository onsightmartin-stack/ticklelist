export type MotionPref = "system" | "full" | "reduced";

export const MOTION_OPTIONS: { id: MotionPref; name: string; description: string }[] = [
  {
    id: "system",
    name: "Match my device",
    description:
      "Follow the operating system's reduced-motion setting. Animations play unless your device asks to limit them.",
  },
  {
    id: "full",
    name: "Full motion",
    description:
      "Always animate — avatars, transitions and effects run even if your device requests reduced motion.",
  },
  {
    id: "reduced",
    name: "Reduced motion",
    description:
      "Turn off animated avatars, transitions and moving effects everywhere on the site.",
  },
];

export const DEFAULT_MOTION: MotionPref = "system";
export const MOTION_STORAGE_KEY = "onsight-motion";
export const MOTION_CHANGE_EVENT = "onsight-motion-change";

export const isMotionPref = (value: unknown): value is MotionPref =>
  typeof value === "string" && MOTION_OPTIONS.some((o) => o.id === value);

export const getStoredMotion = (): MotionPref => {
  if (typeof window === "undefined") return DEFAULT_MOTION;
  try {
    const stored = window.localStorage.getItem(MOTION_STORAGE_KEY);
    return isMotionPref(stored) ? stored : DEFAULT_MOTION;
  } catch {
    return DEFAULT_MOTION;
  }
};

export const applyMotion = (pref: MotionPref) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (pref === "system") root.removeAttribute("data-motion");
  else root.setAttribute("data-motion", pref);
};

export const setMotion = (pref: MotionPref) => {
  applyMotion(pref);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(MOTION_CHANGE_EVENT));
  }
  try {
    window.localStorage.setItem(MOTION_STORAGE_KEY, pref);
  } catch {
    /* storage unavailable — preference still applies for this session */
  }
};

/**
 * True when animations should actually run, taking the explicit override into
 * account and falling back to the OS preference.
 */
export const motionAllowed = (pref: MotionPref = getStoredMotion()): boolean => {
  if (pref === "full") return true;
  if (pref === "reduced") return false;
  if (typeof window === "undefined" || !window.matchMedia) return true;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/** Inline script that applies the saved motion preference before first paint. */
export const motionBootstrapScript = `(function(){try{var m=localStorage.getItem('${MOTION_STORAGE_KEY}');if(m==='full'||m==='reduced'){document.documentElement.setAttribute('data-motion',m);}}catch(e){}})();`;
